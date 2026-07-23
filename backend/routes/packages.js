const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

// Public: GET /api/packages/active — for chatbot use (via tools.js)
// This is internally used. External endpoint kept for flexibility.
router.get('/active', async (req, res) => {
  try {
    const [packages] = await pool.execute(
      'SELECT id, name, destination, category, days, price_per_person, image_url FROM packages WHERE status = ? ORDER BY destination',
      ['active']
    );
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// All admin routes require auth
router.use(authMiddleware);

// GET /api/admin/packages
router.get('/', async (req, res) => {
  try {
    const { status, destination, search } = req.query;
    const conditions = [];
    const values = [];

    if (status) { conditions.push('status = ?'); values.push(status); }
    if (destination) { conditions.push('destination LIKE ?'); values.push(`%${destination}%`); }
    if (search) { conditions.push('(name LIKE ? OR destination LIKE ?)'); values.push(`%${search}%`, `%${search}%`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [packages] = await pool.execute(
      `SELECT id, name, destination, category, days, price_per_person, hotel_category, meals_included, status, created_at
       FROM packages ${where} ORDER BY destination, price_per_person`,
      values
    );
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/packages/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM packages WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Package not found' });
    const pkg = rows[0];
    ['inclusions', 'exclusions', 'itinerary', 'available_dates'].forEach(f => {
      if (pkg[f] && typeof pkg[f] === 'string') {
        try { pkg[f] = JSON.parse(pkg[f]); } catch {}
      }
    });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/packages — create
router.post('/', async (req, res) => {
  try {
    const {
      name, destination, category, days, price_per_person, child_price,
      hotel_category, meals_included, food_preference, inclusions, exclusions,
      itinerary, image_url, available_dates, group_size_limit, status = 'active'
    } = req.body;

    if (!name || !destination || !days || !price_per_person) {
      return res.status(400).json({ error: 'name, destination, days, price_per_person are required' });
    }

    const id = `PKG-${destination.slice(0, 3).toUpperCase()}-${Date.now()}`;
    await pool.execute(
      `INSERT INTO packages (id, name, destination, category, days, price_per_person, child_price,
        hotel_category, meals_included, food_preference, inclusions, exclusions, itinerary,
        image_url, available_dates, group_size_limit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, destination, category || 'family', days, price_per_person, child_price || null,
       hotel_category || '3-star', meals_included || 'breakfast', food_preference || 'any',
       JSON.stringify(inclusions || []), JSON.stringify(exclusions || []),
       JSON.stringify(itinerary || []), image_url || null,
       JSON.stringify(available_dates || []), group_size_limit || 20, status]
    );

    res.status(201).json({ id, message: 'Package created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/packages/:id — update
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['name', 'destination', 'category', 'days', 'price_per_person', 'child_price',
      'hotel_category', 'meals_included', 'food_preference', 'inclusions', 'exclusions',
      'itinerary', 'image_url', 'group_size_limit', 'status'];

    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        const val = ['inclusions', 'exclusions', 'itinerary'].includes(key)
          ? JSON.stringify(req.body[key]) : req.body[key];
        values.push(val);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    await pool.execute(
      `UPDATE packages SET ${updates.join(', ')} WHERE id = ?`,
      [...values, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/packages/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM packages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
