const { verifyToken } = require('../utils/jwt');
const { User, EndUser, Admin, MaintenanceStaff } = require('../models');

// Simple in-memory user cache: token → { user, expiresAt }
// Avoids re-querying the DB on every request from the same session.
const userCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached(token) {
  const entry = userCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    userCache.delete(token);
    return null;
  }
  return entry.user;
}

function setCache(token, user) {
  // Evict old entries if cache grows too large
  if (userCache.size > 500) {
    const oldest = userCache.keys().next().value;
    userCache.delete(oldest);
  }
  userCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL });
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    // Check cache first
    const cached = getCached(token);
    if (cached) {
      req.user = cached;
      return next();
    }

    // Cache miss — query DB
    const user = await User.findByPk(decoded.user_id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: EndUser, required: false },
        { model: Admin, required: false },
        { model: MaintenanceStaff, required: false },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (user.account_status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    setCache(token, user);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role_type)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
