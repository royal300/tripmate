require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://tripmate.royal300.com',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// ── Rate Limiting ──────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,               // 20 requests per minute per IP
  message: { error: 'Too many messages. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Rate limit exceeded.' },
});

// ── Routes ────────────────────────────────────────
app.use('/api/chat', chatLimiter, require('./routes/chat'));
app.use('/api/auth', adminLimiter, require('./routes/auth'));
app.use('/api/admin/leads', adminLimiter, require('./routes/leads'));
app.use('/api/admin/packages', adminLimiter, require('./routes/packages'));
app.use('/api/admin/dashboard', adminLimiter, require('./routes/dashboard'));
app.use('/api/admin/settings', adminLimiter, require('./routes/settings'));
app.use('/api/packages', require('./routes/packages')); // public active packages

// ── Health Check ──────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start Server ──────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 TripMate Backend running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
  });
}

start();

module.exports = app;
