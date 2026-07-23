const { pool } = require('../db/connection');

// ─────────────────────────────────────────────
//  TOOL DEFINITIONS (sent to OpenAI)
// ─────────────────────────────────────────────
const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'search_packages',
      description: 'Search currently active tour packages based on customer criteria. ONLY returns active packages. Call this whenever the customer asks about packages, destinations, prices, or availability.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'e.g. Kerala, Goa, Manali, Rajasthan, Andaman' },
          min_days: { type: 'integer', description: 'Minimum trip duration in days' },
          max_days: { type: 'integer', description: 'Maximum trip duration in days' },
          max_budget: { type: 'number', description: 'Maximum price per person in INR' },
          min_budget: { type: 'number', description: 'Minimum price per person in INR' },
          food_preference: { type: 'string', enum: ['veg', 'non-veg', 'any'] },
          category: { type: 'string', enum: ['honeymoon', 'family', 'adventure', 'pilgrimage', 'budget', 'luxury', 'group'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_package_details',
      description: 'Fetch full details (day-wise itinerary, inclusions, exclusions, hotel info) for a specific package by its ID. Call this when the customer wants more details about a specific package they showed interest in.',
      parameters: {
        type: 'object',
        properties: {
          package_id: { type: 'string', description: 'The unique package ID (e.g., PKG-KER-001)' },
        },
        required: ['package_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'capture_lead',
      description: 'Save the customer name and phone number once they provide it. Call this as soon as you have both name AND phone number from the customer.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer full name' },
          phone_number: { type: 'string', description: 'Customer phone number (WhatsApp preferred)' },
          interested_package_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of package IDs the customer expressed interest in during this conversation',
          },
        },
        required: ['name', 'phone_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description: 'Flag this conversation for immediate human agent follow-up. Use when: customer is frustrated, asks something outside your knowledge, complains, asks about refunds/cancellations, or explicitly requests a human.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Brief reason for escalation' },
          urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['reason', 'urgency'],
      },
    },
  },
];

// Background extraction schema (used in parallel async call)
const EXTRACTION_TOOL = {
  type: 'function',
  function: {
    name: 'extract_lead_signals',
    description: 'Extract structured buying signals from the conversation for internal lead scoring.',
    parameters: {
      type: 'object',
      properties: {
        destination_interest: { type: 'string', description: 'Primary destination customer is interested in' },
        budget_mentioned: { type: 'number', description: 'Budget per person mentioned in INR, null if not mentioned' },
        travel_date_mentioned: { type: 'string', description: 'Travel date or month mentioned, null if not mentioned' },
        group_size: { type: 'integer', description: 'Number of people travelling, null if not mentioned' },
        urgency_level: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
        package_interest_confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        interested_package_ids: { type: 'array', items: { type: 'string' } },
        asked_about_payment: { type: 'boolean' },
        just_browsing: { type: 'boolean' },
      },
      required: ['urgency_level', 'package_interest_confidence'],
    },
  },
};

// ─────────────────────────────────────────────
//  TOOL HANDLERS
// ─────────────────────────────────────────────
async function handleSearchPackages(args) {
  const conditions = ['p.status = ?'];
  const values = ['active'];

  if (args.destination) {
    conditions.push('p.destination LIKE ?');
    values.push(`%${args.destination}%`);
  }
  if (args.category) {
    conditions.push('p.category = ?');
    values.push(args.category);
  }
  if (args.min_days) {
    conditions.push('p.days >= ?');
    values.push(args.min_days);
  }
  if (args.max_days) {
    conditions.push('p.days <= ?');
    values.push(args.max_days);
  }
  if (args.max_budget) {
    conditions.push('p.price_per_person <= ?');
    values.push(args.max_budget);
  }
  if (args.min_budget) {
    conditions.push('p.price_per_person >= ?');
    values.push(args.min_budget);
  }
  if (args.food_preference && args.food_preference !== 'any') {
    conditions.push('(p.food_preference = ? OR p.food_preference = "any")');
    values.push(args.food_preference);
  }

  const sql = `
    SELECT p.id, p.name, p.destination, p.category, p.days,
           p.price_per_person, p.child_price, p.hotel_category,
           p.meals_included, p.food_preference, p.inclusions, p.image_url
    FROM packages p
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.price_per_person ASC
    LIMIT 5
  `;

  const [rows] = await pool.execute(sql, values);
  if (rows.length === 0) {
    return { results: [], message: 'No active packages found matching the criteria.' };
  }

  // Parse JSON fields
  return {
    results: rows.map(r => ({
      ...r,
      inclusions: typeof r.inclusions === 'string' ? JSON.parse(r.inclusions) : r.inclusions,
    })),
  };
}

async function handleGetPackageDetails(args) {
  const [rows] = await pool.execute(
    'SELECT * FROM packages WHERE id = ? AND status = ?',
    [args.package_id, 'active']
  );
  if (rows.length === 0) {
    return { error: 'Package not found or no longer available.' };
  }
  const pkg = rows[0];
  return {
    ...pkg,
    inclusions: typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : pkg.inclusions,
    exclusions: typeof pkg.exclusions === 'string' ? JSON.parse(pkg.exclusions) : pkg.exclusions,
    itinerary: typeof pkg.itinerary === 'string' ? JSON.parse(pkg.itinerary) : pkg.itinerary,
  };
}

async function handleCaptureLead(args, sessionId) {
  // Check if lead already exists for this session
  const [existing] = await pool.execute(
    'SELECT id FROM leads WHERE session_id = ?',
    [sessionId]
  );

  const packageIds = JSON.stringify(args.interested_package_ids || []);

  if (existing.length > 0) {
    await pool.execute(
      'UPDATE leads SET name = ?, phone_number = ?, matched_package_ids = ?, status = "new" WHERE session_id = ?',
      [args.name, args.phone_number, packageIds, sessionId]
    );
  } else {
    await pool.execute(
      'INSERT INTO leads (session_id, name, phone_number, matched_package_ids) VALUES (?, ?, ?, ?)',
      [sessionId, args.name, args.phone_number, packageIds]
    );
  }

  return { success: true, message: 'Lead captured successfully.' };
}

async function handleEscalateToHuman(args, sessionId) {
  // Mark the lead for escalation
  await pool.execute(
    `INSERT INTO leads (session_id, notes, status) VALUES (?, ?, 'new')
     ON DUPLICATE KEY UPDATE notes = CONCAT(COALESCE(notes, ''), '\n[ESCALATED]: ', ?)`,
    [sessionId, `[ESCALATED: ${args.urgency}] ${args.reason}`, `[ESCALATED: ${args.urgency}] ${args.reason}`]
  );
  return { success: true, message: 'Escalation flagged. A human agent will follow up shortly.' };
}

async function executeTool(toolName, toolArgs, sessionId) {
  try {
    switch (toolName) {
      case 'search_packages':
        return await handleSearchPackages(toolArgs);
      case 'get_package_details':
        return await handleGetPackageDetails(toolArgs);
      case 'capture_lead':
        return await handleCaptureLead(toolArgs, sessionId);
      case 'escalate_to_human':
        return await handleEscalateToHuman(toolArgs, sessionId);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    console.error(`Tool execution error (${toolName}):`, err);
    return { error: 'Tool execution failed.' };
  }
}

module.exports = { TOOL_SCHEMAS, EXTRACTION_TOOL, executeTool };
