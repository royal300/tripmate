const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/admin/settings
router.get('/', async (req, res) => {
  try {
    const [settings] = await pool.execute('SELECT setting_key, setting_value FROM bot_settings');
    const map = {};
    settings.forEach(s => { map[s.setting_key] = s.setting_value; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/settings
router.patch('/', async (req, res) => {
  try {
    const updates = Object.entries(req.body);
    for (const [key, value] of updates) {
      await pool.execute(
        'INSERT INTO bot_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/scoring-rules
router.get('/scoring-rules', async (req, res) => {
  try {
    const [rules] = await pool.execute('SELECT * FROM scoring_rules ORDER BY id');
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/scoring-rules/:id
router.patch('/scoring-rules/:id', async (req, res) => {
  try {
    const { points, enabled } = req.body;
    const updates = [];
    const values = [];
    if (points !== undefined) { updates.push('points = ?'); values.push(points); }
    if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    await pool.execute(`UPDATE scoring_rules SET ${updates.join(', ')} WHERE id = ?`, [...values, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
