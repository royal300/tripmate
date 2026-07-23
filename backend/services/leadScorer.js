const { pool } = require('../db/connection');

/**
 * Calculates the lead score based on scoring_rules from DB
 * and the accumulated lead signals from the session.
 */
async function calculateScore(leadData) {
  const [rules] = await pool.execute(
    'SELECT signal_name, points FROM scoring_rules WHERE enabled = 1'
  );
  const ruleMap = {};
  rules.forEach(r => { ruleMap[r.signal_name] = r.points; });

  const breakdown = {};
  let score = 0;

  const add = (signal, condition) => {
    if (condition && ruleMap[signal] !== undefined) {
      breakdown[signal] = ruleMap[signal];
      score += ruleMap[signal];
    }
  };

  add('budget_mentioned', leadData.budget_mentioned != null);
  add('group_size_shared', leadData.group_size != null);
  add('contact_captured', !!(leadData.name && leadData.phone_number));
  add('high_urgency', leadData.urgency_level === 'high');
  add('payment_query', leadData.asked_about_payment === true);
  add('just_browsing', leadData.just_browsing === true);
  add('specific_package_discussed',
    Array.isArray(leadData.interested_package_ids) && leadData.interested_package_ids.length > 0
  );

  // Travel date urgency
  if (leadData.travel_date_mentioned) {
    // Heuristic: if "urgent", "asap", "this week", "this month" → high urgency
    const urgentKeywords = ['urgent', 'asap', 'this week', 'this month', 'immediate'];
    const isUrgentDate = urgentKeywords.some(k =>
      leadData.travel_date_mentioned.toLowerCase().includes(k)
    );
    add('travel_date_within_30_days', isUrgentDate || leadData.urgency_level === 'high');
  }

  // Package confidence
  if (leadData.package_interest_confidence === 'high') {
    score += 10;
    breakdown['high_package_confidence'] = 10;
  }

  // Get thresholds from settings
  const [thresholds] = await pool.execute(
    "SELECT setting_key, setting_value FROM bot_settings WHERE setting_key IN ('hot_lead_threshold','warm_lead_threshold')"
  );
  const thresholdMap = {};
  thresholds.forEach(t => { thresholdMap[t.setting_key] = parseInt(t.setting_value); });

  const hotThreshold = thresholdMap['hot_lead_threshold'] || 70;
  const warmThreshold = thresholdMap['warm_lead_threshold'] || 35;

  let band = 'cold';
  if (score >= hotThreshold) band = 'hot';
  else if (score >= warmThreshold) band = 'warm';

  return { score: Math.max(0, score), band, breakdown };
}

/**
 * Updates the lead record in DB with the latest signals and recalculated score.
 */
async function updateLeadScore(sessionId, signals) {
  const { score, band, breakdown } = await calculateScore(signals);

  const [existing] = await pool.execute(
    'SELECT id FROM leads WHERE session_id = ?',
    [sessionId]
  );

  const fields = {
    score,
    score_band: band,
    score_breakdown: JSON.stringify(breakdown),
    primary_interest: signals.destination_interest || null,
    budget_mentioned: signals.budget_mentioned || null,
    travel_date_mentioned: signals.travel_date_mentioned || null,
    group_size: signals.group_size || null,
    urgency_level: signals.urgency_level || 'none',
    package_interest_confidence: signals.package_interest_confidence || 'low',
    matched_package_ids: JSON.stringify(signals.interested_package_ids || []),
  };

  if (existing.length > 0) {
    const setClause = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await pool.execute(
      `UPDATE leads SET ${setClause} WHERE session_id = ?`,
      [...Object.values(fields), sessionId]
    );
  } else {
    await pool.execute(
      `INSERT INTO leads (session_id, score, score_band, score_breakdown, primary_interest,
        budget_mentioned, travel_date_mentioned, group_size, urgency_level,
        package_interest_confidence, matched_package_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, score, band, JSON.stringify(breakdown),
        fields.primary_interest, fields.budget_mentioned, fields.travel_date_mentioned,
        fields.group_size, fields.urgency_level, fields.package_interest_confidence,
        fields.matched_package_ids]
    );
  }

  console.log(`📊 Lead scored [${sessionId.slice(0,8)}]: ${score} → ${band.toUpperCase()}`);
  return { score, band, breakdown };
}

module.exports = { calculateScore, updateLeadScore };
