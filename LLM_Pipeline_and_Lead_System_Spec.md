# LLM Interaction Pipeline & Lead Intelligence System
## Technical Specification — TripMate AI

| | |
|---|---|
| **Document Type** | Technical Design Spec (Pipe-to-Pipe) |
| **Covers** | LLM orchestration, prompt design, admin panel LLM controls, data collection, lead scoring |
| **Version** | 1.0 |

---

## 1. End-to-End Pipeline Overview (Pipe-to-Pipe)

```
[1] USER TYPES MESSAGE (Chat UI)
        │
        ▼
[2] FRONTEND → API GATEWAY
        │ (HTTPS POST /api/chat, session_id attached)
        ▼
[3] BACKEND: CONVERSATION ORCHESTRATOR
        │ - Loads session context from Redis (last N messages)
        │ - Loads/updates lead profile (partial data collected so far)
        │ - Constructs the full LLM request payload
        ▼
[4] LLM REQUEST (System Prompt + History + Tool Schemas + User Message)
        │
        ▼
[5] LLM DECIDES: Does this need a tool call, or plain reply?
        │
        ├── (a) TOOL CALL NEEDED (e.g., search_packages)
        │        │
        │        ▼
        │   [5a] Backend executes tool → MySQL query (status='active' only)
        │        │
        │        ▼
        │   [5b] Tool result JSON sent BACK to LLM
        │        │
        │        ▼
        │   [5c] LLM generates final natural-language reply grounded in tool result
        │
        └── (b) NO TOOL NEEDED → LLM replies directly (greetings, clarifications, small talk)
        │
        ▼
[6] PARALLEL ASYNC PROCESS: EXTRACTION + SCORING
        │ - Separate lightweight LLM call (or same call, structured output)
        │ - Extracts: destination, budget, dates, group size, urgency signals
        │ - Updates lead record + recalculates Hot/Warm/Cold score
        │ - This NEVER blocks the user-facing response (fire-and-forget / queued)
        ▼
[7] RESPONSE STREAMED BACK TO FRONTEND
        │ (token-by-token via SSE/WebSocket for low perceived latency)
        ▼
[8] FRONTEND RENDERS
        │ - Text bubble, or Package Carousel, or Quick Reply Chips,
        │   or Lead Capture Form — based on response "type" flag
        ▼
[9] CONVERSATION + LEAD DATA PERSISTED
        │ (MySQL: messages table, leads table — updated every turn)
        ▼
[10] IF LEAD SCORE = HOT → Notification Service fires alert to admin/agent
```

This entire loop (steps 1–8) should complete in **under 2-4 seconds** for a good user experience, with streaming making the first words appear in under 1.5 seconds.

---

## 2. The System Prompt (Persona + Rules)

The system prompt is the LLM's "job description" — sent on every single request, invisible to the user. This is the single most important piece of prompt engineering in the whole system.

### 2.1 Structure of the System Prompt

```
IDENTITY
You are Riya, the AI travel consultant for [Agency Name]. You are warm, professional, 
knowledgeable, and genuinely enthusiastic about travel — like a skilled human receptionist 
at a premium travel agency, not a generic chatbot.

TONE & STYLE RULES
- Keep responses concise (2-4 sentences for simple answers; use structured lists only 
  when comparing multiple packages)
- Use natural, warm language. Light enthusiasm is good ("That's a beautiful time to visit 
  Kerala!") but never exaggerated or salesy.
- Match the customer's language style — if they write in Hindi/Hinglish, respond naturally 
  in kind.
- Never sound robotic or use phrases like "As an AI language model" or "I don't have 
  access to real-time data."
- Ask ONE clarifying question at a time, never a long list of questions at once.

STRICT DATA RULES (NON-NEGOTIABLE)
- NEVER state a price, itinerary detail, inclusion, or availability that did not come 
  from a search_packages or get_package_details tool result in THIS conversation.
- If you don't have the tool result yet, call the tool. Do not guess or estimate.
- If a tool returns no results, say so honestly and offer the closest alternative or 
  offer to connect them with a human agent — never invent a package.
- Only ever discuss packages returned by the tools (these are pre-filtered to 
  currently active packages only — you will never see inactive ones).

CONVERSATION GOALS (in priority order)
1. Understand what the customer wants (destination, budget, dates, group type)
2. Provide accurate, helpful answers using the search_packages tool
3. After delivering real value (at least one substantive answer), naturally invite 
   them to share their name and phone number — framed as helpful 
   ("so I can send you the full itinerary / check live availability for you")
   using the capture_lead tool
4. If the customer seems confused, frustrated, or asks something outside your 
   knowledge (visa issues, complaints, custom requests), offer to connect them 
   with a human agent using the escalate_to_human tool

BOUNDARIES
- Do not discuss competitor agencies.
- Do not make promises about discounts, refunds, or custom itineraries beyond what 
  is in the package data.
- Do not provide legal, medical, or visa-specific advice — direct these to a human agent.
```

### 2.2 Why this structure works
- **Identity section** sets persona tone once, so every reply feels consistent.
- **Strict data rules** are the actual mechanism preventing hallucination — combined with tool-calling architecture, this is a two-layer defense (prompt instruction + structural grounding).
- **Conversation goals** give the LLM a "sales funnel" mindset without sounding scripted, since it decides *how* and *when* naturally based on conversation flow, not a rigid decision tree.

---

## 3. Tool / Function Schemas (What the LLM Can "Do")

These are the structured actions the LLM can invoke instead of generating free text. This is the core of accurate, grounded responses.

### 3.1 `search_packages`
```json
{
  "name": "search_packages",
  "description": "Search currently active tour packages based on customer criteria. Only returns active packages.",
  "parameters": {
    "destination": { "type": "string", "description": "e.g. Kerala, Goa, Manali" },
    "min_days": { "type": "integer" },
    "max_days": { "type": "integer" },
    "max_budget": { "type": "number" },
    "food_preference": { "type": "string", "enum": ["veg", "non-veg", "any"] },
    "package_type": { "type": "string", "enum": ["honeymoon", "family", "adventure", "pilgrimage", "budget", "luxury"] }
  }
}
```

### 3.2 `get_package_details`
```json
{
  "name": "get_package_details",
  "description": "Fetch full details (itinerary, inclusions, exclusions, hotel category) for a specific package by ID.",
  "parameters": {
    "package_id": { "type": "string" }
  }
}
```

### 3.3 `capture_lead`
```json
{
  "name": "capture_lead",
  "description": "Save the customer's name and phone number once they provide it, along with their expressed interest.",
  "parameters": {
    "name": { "type": "string" },
    "phone_number": { "type": "string" },
    "interested_package_ids": { "type": "array", "items": { "type": "string" } }
  }
}
```

### 3.4 `escalate_to_human`
```json
{
  "name": "escalate_to_human",
  "description": "Flag this conversation for immediate human agent follow-up when the AI cannot resolve the query or the customer requests a human.",
  "parameters": {
    "reason": { "type": "string" },
    "urgency": { "type": "string", "enum": ["low", "medium", "high"] }
  }
}
```

### 3.5 `extract_lead_signals` (background, not conversational)
This one is called silently on a parallel/async path — not part of the visible chat reply — purely to update the lead scoring engine.
```json
{
  "name": "extract_lead_signals",
  "description": "Extract structured buying signals from the conversation so far, for internal lead scoring.",
  "parameters": {
    "budget_mentioned": { "type": "number" },
    "travel_date_mentioned": { "type": "string" },
    "group_size": { "type": "integer" },
    "urgency_level": { "type": "string", "enum": ["none", "low", "medium", "high"] },
    "package_interest_confidence": { "type": "string", "enum": ["low", "medium", "high"] }
  }
}
```

---

## 4. How the LLM Response Actually Gets Generated (Step-by-Step Example)

**User:** "kerala me family ke liye 5 din ka package hai kya, budget 25k tak"

**Step 1 — LLM receives:** system prompt + conversation history + this message + tool schemas

**Step 2 — LLM reasons internally and decides to call a tool:**
```json
{
  "tool_call": "search_packages",
  "arguments": {
    "destination": "Kerala",
    "max_days": 5,
    "package_type": "family",
    "max_budget": 25000
  }
}
```

**Step 3 — Backend executes this as a MySQL query:**
```sql
SELECT * FROM packages
WHERE destination = 'Kerala'
  AND days <= 5
  AND category = 'family'
  AND price_per_person <= 25000
  AND status = 'active'
ORDER BY price_per_person ASC
LIMIT 5;
```

**Step 4 — Query result (real data) sent back to LLM:**
```json
[
  { "id": "PKG_KER_004", "name": "Kerala Family Bliss", "days": 5, "price": 22000, "hotel": "3-star", "meals": "breakfast+dinner" }
]
```

**Step 5 — LLM generates the final reply, grounded in this exact data:**
> "Haan bilkul! We have a 5-day 'Kerala Family Bliss' package at ₹22,000 per person, with 3-star hotels and breakfast + dinner included. Would you like me to share the full day-wise itinerary?"

**Step 6 (parallel, invisible to user)** — `extract_lead_signals` fires:
```json
{ "budget_mentioned": 25000, "package_interest_confidence": "high", "group_size": null, "urgency_level": "low" }
```
This updates the lead's running score in the background.

This is the entire mechanism that guarantees the price "₹22,000" is never invented — it flows directly from the database through the tool result into the final sentence.

---

## 5. How User Data Is Collected

Data collection happens in **two parallel tracks**:

### Track A — Explicit Capture (via `capture_lead` tool)
Triggered conversationally, not via a rigid form-first approach:
1. LLM answers the user's first substantive question
2. LLM naturally transitions: *"I can send you the complete day-wise itinerary and check live seat availability — what name should I note this under, and your WhatsApp number?"*
3. Frontend renders the inline lead-capture UI bubble
4. User fills name + number → sent to backend → `capture_lead` tool call fires → saved to `leads` table

### Track B — Implicit/Passive Extraction (via `extract_lead_signals`)
Runs on every turn, silently, regardless of whether the user has given contact info yet:
- Budget mentions, destination interest, date urgency, group size, package IDs discussed, number of follow-up questions
- This builds a **running profile** of the lead even before/without a phone number — valuable because even anonymous sessions contribute to campaign-level analytics (e.g., "60% of Kerala-ad clickers ask about honeymoon packages")

### Data Stored Per Lead
```
name, phone_number, source_campaign, session_id,
matched_package_ids[], primary_interest, budget_mentioned,
travel_date_mentioned, group_size, urgency_level,
conversation_summary (LLM-generated), score, score_band,
status (new/contacted/converted/lost), created_at
```

The `conversation_summary` field is itself LLM-generated at session end (or after inactivity timeout) — a 1-2 sentence summary an agent can read in 3 seconds instead of scrolling the full transcript: *"Interested in Kerala Family Bliss (₹22k), asked about veg food options twice, no travel date given yet."*

---

## 6. Lead Categorization — Full Logic

### 6.1 Scoring Inputs (combined from both tracks above)

| Signal | Points | Detected By |
|---|---|---|
| Specific package explicitly discussed (2+ times) | +20 | Rule: mention count on `matched_package_ids` |
| Budget mentioned | +15 | `extract_lead_signals` |
| Travel date within 30 days | +25 | `extract_lead_signals` (date parsing) |
| Group size / family details shared | +10 | `extract_lead_signals` |
| Name + phone number captured | +20 | `capture_lead` fired |
| Asked about payment/booking/"how to confirm" | +25 | Keyword + intent classification |
| High urgency language ("urgent", "this week", "ASAP") | +20 | `extract_lead_signals.urgency_level` |
| Vague single-message browsing, no follow-up | −10 | Rule: message count = 1, no signals |
| Ignored 2+ clarifying questions | −15 | Rule: bot asked, user didn't answer |
| Explicitly says "just browsing" / "not sure yet" | −20 | Intent classification |

### 6.2 Score Bands
| Band | Score Range | Action |
|---|---|---|
| 🔥 **Hot** | 70–100 | Instant notification to agent (SMS/push), top of lead queue, suggested callback within 1 hour |
| 🌤 **Warm** | 35–69 | Added to daily follow-up queue, agent calls within 24 hours |
| ❄️ **Cold** | 0–34 | Nurture list — no immediate call, candidate for automated re-engagement (Phase 2: email/SMS drip) |

### 6.3 Scoring Recalculates Every Turn
The score isn't computed once — it's recalculated after every user message, since intent can strengthen or weaken through the conversation. A lead can move from Cold → Warm → Hot within a single session as they reveal more (budget → dates → "how do I book").

### 6.4 Admin Override
Every score is **editable by the agency owner/agent** in the admin panel lead detail view — AI scoring is a strong default, not a locked verdict. Manual overrides are logged (for future scoring-model tuning).

---

## 7. Admin Panel — LLM & Lead-Specific Controls

Beyond the general admin panel modules covered in the PRD, these are the **LLM-and-lead-specific** controls the owner needs:

### 7.1 Bot Persona Settings
- Edit greeting message
- Edit tone description (formal / friendly / enthusiastic slider or free text)
- Edit business name used in system prompt
- Toggle Hindi/Hinglish support on/off

### 7.2 Scoring Rules Configuration
- Adjustable point values for each signal in the table above (simple number inputs, not code)
- Adjustable score band thresholds (e.g., move Hot cutoff from 70 to 60)
- Toggle individual signals on/off

### 7.3 FAQ / Knowledge Base Manager
- Add Q&A pairs for things outside package data (cancellation policy, payment methods, office hours, visa guidance disclaimer)
- These feed the lightweight RAG layer mentioned in the PRD — separate from structured package search

### 7.4 Escalation Rules
- Define keywords/situations that trigger `escalate_to_human` (e.g., "refund", "complaint", "cancel booking")
- Set notification channel for escalations (SMS/email/push) and recipient

### 7.5 Lead Detail View (per lead)
- Full transcript (collapsible)
- AI-generated summary
- Score + score breakdown (which signals fired, so agent understands *why* it's Hot, not just that it is)
- Editable score band
- Notes field
- Status dropdown (new/contacted/converted/lost)
- "Matched packages" quick links

### 7.6 Conversation Quality Review
- Flagged conversations where the bot called `escalate_to_human` or had a tool call return zero results — helps the owner spot gaps in package data coverage or FAQ gaps

---

## 8. Failure & Edge Case Handling

| Scenario | System Behavior |
|---|---|
| `search_packages` returns zero results | LLM offers closest match (wider budget/day range) or invites human follow-up — never says "nothing exists" flatly |
| LLM API times out / errors | Backend falls back to a cached generic response: "I'm having a small hiccup — let me connect you with our team directly," and fires `escalate_to_human` automatically |
| User provides invalid phone number format | Frontend validates before submission; bot politely asks again in the same inline form, not a jarring error popup |
| User asks something entirely unrelated to travel | LLM politely redirects: acknowledges, steers back to how it can help with travel planning |
| Package goes inactive mid-conversation (owner disables it while chat is live) | Next `search_packages`/`get_package_details` call automatically excludes it — LLM naturally won't reference it again, even if mentioned earlier in the same session |

---

*End of Document*
