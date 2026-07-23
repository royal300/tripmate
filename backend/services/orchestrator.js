const OpenAI = require('openai');
const { pool } = require('../db/connection');
const { TOOL_SCHEMAS, EXTRACTION_TOOL, executeTool } = require('./tools');
const { addMessage, getMessages, getOrCreateSession, updateLeadData, getLeadData } = require('./sessionStore');
const { updateLeadScore } = require('./leadScorer');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Fetches the system prompt from DB settings, building the full persona.
 */
async function buildSystemPrompt() {
  const [rows] = await pool.execute(
    "SELECT setting_key, setting_value FROM bot_settings WHERE setting_key IN ('greeting_message','agent_name','agency_name','tone','hindi_support','business_hours','escalation_keywords')"
  );
  const s = {};
  rows.forEach(r => { s[r.setting_key] = r.setting_value; });

  const agentName = s['agent_name'] || 'Riya';
  const agencyName = s['agency_name'] || 'TripMate';
  const tone = s['tone'] || 'warm, professional, consultative';
  const businessHours = s['business_hours'] || '9 AM - 8 PM IST, Mon-Sat';
  const escalationKeywords = s['escalation_keywords'] || '["refund","complaint","cancel"]';
  const hindiSupport = s['hindi_support'] === 'true';

  return `IDENTITY
You are ${agentName}, the AI travel consultant for ${agencyName}. You are ${tone} — like a skilled human receptionist at a premium travel agency, not a generic chatbot. You genuinely love travel and helping people plan memorable experiences.

TONE & STYLE RULES
- Keep responses concise: 2-4 sentences for simple answers; use structured lists only when comparing multiple packages.
- Use natural, warm language. Light enthusiasm is great ("That's a beautiful time to visit Kerala! 🌿") but never exaggerated or salesy.
${hindiSupport ? '- Match the customer\'s language style — if they write in Hindi or Hinglish, respond naturally in kind.' : ''}
- Never say "As an AI language model" or "I don\'t have access to real-time data."
- Ask ONE clarifying question at a time, never a long list at once.
- Always use the customer's name if you know it.

STRICT DATA RULES (NON-NEGOTIABLE)
- NEVER state a price, itinerary detail, inclusion, or availability that did not come directly from a search_packages or get_package_details tool result in THIS conversation.
- If you don't have the tool result yet, call the tool. Do not guess or estimate prices.
- If a tool returns no results, say so honestly and offer the closest alternative or offer to connect them with a human agent — never invent a package.
- Only ever discuss packages returned by tools (these are pre-filtered to currently active packages only).

CONVERSATION GOALS (in priority order)
1. Understand what the customer wants (destination, budget, dates, group type, occasion)
2. Provide accurate, helpful answers using the search_packages tool
3. After delivering real value (at least one substantive answer with real package data), naturally invite them to share their name and WhatsApp number — framed as helpful (e.g., "I can send you the full itinerary and check current availability — what name should I save this under, and your WhatsApp number?"), then call the capture_lead tool
4. If the customer seems confused, frustrated, or asks something outside your knowledge (visa issues, complaints, refunds, custom requests), use the escalate_to_human tool

BUSINESS INFO
- Agency: ${agencyName}
- Business Hours: ${businessHours}
- For booking confirmation and payment, a human agent will follow up

BOUNDARIES
- Do not discuss competitor agencies.
- Do not make promises about discounts, refunds, or custom itineraries beyond what is in the package data.
- Do not provide legal, medical, or visa-specific advice — direct these to a human agent.
- Escalate immediately if you detect these keywords: ${escalationKeywords}`;
}

/**
 * Saves a message to the MySQL messages table.
 */
async function persistMessage(sessionId, role, content, toolName = null, toolCallId = null) {
  try {
    await pool.execute(
      'INSERT INTO messages (session_id, role, content, tool_name, tool_call_id) VALUES (?, ?, ?, ?, ?)',
      [sessionId, role, typeof content === 'string' ? content : JSON.stringify(content), toolName, toolCallId]
    );
  } catch (err) {
    console.error('Failed to persist message:', err.message);
  }
}

/**
 * Runs the background extraction pass to update lead signals asynchronously.
 */
async function runExtractionPass(sessionId, messages) {
  try {
    const extractionMessages = [
      {
        role: 'system',
        content: 'You are a lead scoring assistant. Analyze this travel consultation conversation and extract buying signals using the extract_lead_signals tool. Be precise and conservative — only set fields you are confident about from explicit conversation evidence.',
      },
      ...messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-10),
    ];

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: extractionMessages,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'function', function: { name: 'extract_lead_signals' } },
      max_tokens: 300,
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const signals = JSON.parse(toolCall.function.arguments);
      // Merge with existing lead data from session
      const existingData = getLeadData(sessionId);
      const merged = { ...existingData, ...signals };
      updateLeadData(sessionId, merged);
      // Update DB score
      await updateLeadScore(sessionId, merged);
    }
  } catch (err) {
    console.error('Background extraction failed:', err.message);
  }
}

/**
 * Main orchestration function — processes one user message and streams the response.
 */
async function orchestrate(sessionId, userMessage, res) {
  // Ensure session and DB session record exist
  getOrCreateSession(sessionId);
  await pool.execute(
    'INSERT IGNORE INTO sessions (session_token) VALUES (?)',
    [sessionId]
  ).catch(() => {}); // Ignore if already exists

  // Build system prompt
  const systemPrompt = await buildSystemPrompt();

  // Get existing message history
  const history = getMessages(sessionId);

  // Add user message to history
  const userMsg = { role: 'user', content: userMessage };
  addMessage(sessionId, userMsg);
  await persistMessage(sessionId, 'user', userMessage);

  // Build full message list for OpenAI
  let messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    userMsg,
  ];

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Agentic loop — LLM may call tools multiple times before a final reply
    let finalText = '';
    let responseType = 'text';
    let packageResults = null;
    let capturedLead = null;
    let escalated = false;
    let iterations = 0;

    while (iterations < 5) {
      iterations++;

      const response = await openai.chat.completions.create({
        model: MODEL,
        messages,
        tools: TOOL_SCHEMAS,
        tool_choice: 'auto',
        stream: true,
        max_tokens: 600,
        temperature: 0.7,
      });

      let currentContent = '';
      let toolCalls = [];
      let currentToolCall = null;

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        if (delta?.content) {
          currentContent += delta.content;
          sendEvent('token', { text: delta.content });
        }

        // Collect tool calls
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index !== undefined) {
              if (!toolCalls[tc.index]) {
                toolCalls[tc.index] = { id: '', function: { name: '', arguments: '' } };
              }
              if (tc.id) toolCalls[tc.index].id = tc.id;
              if (tc.function?.name) toolCalls[tc.index].function.name = tc.function.name;
              if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
            }
          }
        }

        if (finishReason === 'stop') {
          finalText = currentContent;
          break;
        }

        if (finishReason === 'tool_calls') {
          // Execute all tool calls
          const assistantMsg = {
            role: 'assistant',
            content: currentContent || null,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.function.name, arguments: tc.function.arguments },
            })),
          };
          messages.push(assistantMsg);

          for (const tc of toolCalls) {
            const toolName = tc.function.name;
            let toolArgs = {};
            try { toolArgs = JSON.parse(tc.function.arguments); } catch {}

            console.log(`🔧 Tool call: ${toolName}`, toolArgs);
            const toolResult = await executeTool(toolName, toolArgs, sessionId);

            // Track what happened for response type
            if (toolName === 'search_packages' && toolResult.results?.length > 0) {
              packageResults = toolResult.results;
              responseType = 'packages';
            }
            if (toolName === 'capture_lead') {
              capturedLead = toolArgs;
              // Also update session lead data
              updateLeadData(sessionId, { name: toolArgs.name, phone_number: toolArgs.phone_number });
            }
            if (toolName === 'escalate_to_human') {
              escalated = true;
              responseType = 'escalation';
            }

            const toolMsg = {
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(toolResult),
            };
            messages.push(toolMsg);

            await persistMessage(sessionId, 'tool', JSON.stringify(toolResult), toolName, tc.id);
          }

          toolCalls = [];
          break; // Go back to top of while loop for next LLM call with tool results
        }
      }

      if (finalText) break;
    }

    // Save final assistant message to session + DB
    if (finalText) {
      const assistantMsg = { role: 'assistant', content: finalText };
      addMessage(sessionId, assistantMsg);
      await persistMessage(sessionId, 'assistant', finalText);
    }

    // Send completion event with metadata
    sendEvent('done', {
      responseType,
      packages: packageResults,
      capturedLead,
      escalated,
      sessionId,
    });

    res.end();

    // Fire background extraction pass (non-blocking)
    const allMessages = getMessages(sessionId);
    setImmediate(() => runExtractionPass(sessionId, allMessages));

  } catch (err) {
    console.error('Orchestration error:', err);
    sendEvent('error', { message: 'I\'m having a small hiccup — please try again in a moment.' });
    res.end();
  }
}

module.exports = { orchestrate, buildSystemPrompt };
