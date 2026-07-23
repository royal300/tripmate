const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

// All routes require admin auth
router.use(authMiddleware);

// GET /api/admin/leads — list all leads with filters
router.get('/', async (req, res) => {
  try {
    const { band, status, search, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const values = [];

    if (band) { conditions.push('score_band = ?'); values.push(band); }
    if (status) { conditions.push('l.status = ?'); values.push(status); }
    if (search) {
      conditions.push('(l.name LIKE ? OR l.phone_number LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [leads] = await pool.execute(
      `SELECT l.id, l.name, l.phone_number, l.score, l.score_band, l.status,
              l.primary_interest, l.budget_mentioned, l.urgency_level,
              l.ai_summary, l.created_at, l.updated_at
       FROM leads l ${where}
       ORDER BY l.score DESC, l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM leads l ${where}`, values
    );

    res.json({ leads, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/leads/:id — lead detail with full transcript
router.get('/:id', async (req, res) => {
  try {
    const [leads] = await pool.execute('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!leads.length) return res.status(404).json({ error: 'Lead not found' });

    const lead = leads[0];
    // Parse JSON fields
    ['matched_package_ids', 'score_breakdown'].forEach(f => {
      if (lead[f] && typeof lead[f] === 'string') {
        try { lead[f] = JSON.parse(lead[f]); } catch {}
      }
    });

    // Get conversation messages
    const [messages] = await pool.execute(
      'SELECT role, content, tool_name, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      [lead.session_id]
    );

    res.json({ lead, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/leads/:id — update lead status/notes/score band
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes, score_band, assigned_agent_id, ai_summary } = req.body;
    const updates = [];
    const values = [];

    if (status) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (score_band) { updates.push('score_band = ?'); values.push(score_band); }
    if (assigned_agent_id) { updates.push('assigned_agent_id = ?'); values.push(assigned_agent_id); }
    if (ai_summary) { updates.push('ai_summary = ?'); values.push(ai_summary); }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    await pool.execute(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`,
      [...values, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
