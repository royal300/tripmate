const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { orchestrate } = require('../services/orchestrator');

/**
 * POST /api/chat
 * Body: { message: string, sessionId?: string }
 * Response: Server-Sent Events stream
 */
router.post('/', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (message.trim().length > 2000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  const sid = sessionId || uuidv4();

  try {
    await orchestrate(sid, message.trim(), res);
  } catch (err) {
    console.error('Chat route error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;
