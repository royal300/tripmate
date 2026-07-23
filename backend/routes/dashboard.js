const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/admin/dashboard
router.get('/', async (req, res) => {
  try {
    const [[totals]] = await pool.execute(`
      SELECT
        COUNT(*) as total_leads,
        SUM(score_band = 'hot') as hot_leads,
        SUM(score_band = 'warm') as warm_leads,
        SUM(score_band = 'cold') as cold_leads,
        SUM(status = 'converted') as converted,
        SUM(status = 'contacted') as contacted,
        SUM(status = 'new') as new_leads
      FROM leads
    `);

    const [[packageStats]] = await pool.execute(`
      SELECT
        COUNT(*) as total_packages,
        SUM(status = 'active') as active_packages
      FROM packages
    `);

    // Leads over last 7 days
    const [recentLeads] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count, score_band
      FROM leads
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at), score_band
      ORDER BY date ASC
    `);

    // Top interests
    const [topInterests] = await pool.execute(`
      SELECT primary_interest, COUNT(*) as count
      FROM leads
      WHERE primary_interest IS NOT NULL
      GROUP BY primary_interest
      ORDER BY count DESC
      LIMIT 5
    `);

    res.json({
      leads: totals,
      packages: packageStats,
      recentLeads,
      topInterests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
