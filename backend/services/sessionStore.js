// In-memory session store
// Production note: swap this for Redis with ioredis for horizontal scaling
const sessions = new Map();

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  // Auto-expire
  if (Date.now() - session.lastActive > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

function createSession(sessionId) {
  const session = {
    id: sessionId,
    messages: [],       // Full OpenAI message history
    leadData: {},       // Accumulated lead signals
    lastActive: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

function getOrCreateSession(sessionId) {
  return getSession(sessionId) || createSession(sessionId);
}

function updateSession(sessionId, updates) {
  const session = getOrCreateSession(sessionId);
  Object.assign(session, updates, { lastActive: Date.now() });
  sessions.set(sessionId, session);
  return session;
}

function addMessage(sessionId, message) {
  const session = getOrCreateSession(sessionId);
  session.messages.push(message);
  // Keep last 30 messages to control token count
  if (session.messages.length > 30) {
    session.messages = session.messages.slice(-30);
  }
  session.lastActive = Date.now();
  sessions.set(sessionId, session);
}

function getMessages(sessionId) {
  const session = getSession(sessionId);
  return session ? session.messages : [];
}

function updateLeadData(sessionId, signals) {
  const session = getOrCreateSession(sessionId);
  session.leadData = { ...session.leadData, ...signals };
  session.lastActive = Date.now();
  sessions.set(sessionId, session);
  return session.leadData;
}

function getLeadData(sessionId) {
  const session = getSession(sessionId);
  return session ? session.leadData : {};
}

// Cleanup expired sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActive > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

module.exports = {
  getSession,
  createSession,
  getOrCreateSession,
  updateSession,
  addMessage,
  getMessages,
  updateLeadData,
  getLeadData,
};
