const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the "Authorization: Bearer <token>" header and attaches
 * req.user = { id, email, role } for protected routes.
 * The role is re-fetched from the DB so revoked/changed roles take effect
 * without waiting for token expiry.
 */
const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token. Please log in again.';
    return res.status(401).json({ success: false, message });
  }

  try {
    const user = await User.findById(decoded.id).select('role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account no longer exists.' });
    }
    req.user = { id: decoded.id, email: decoded.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

/** Restricts a route to admin accounts only (must run after authMiddleware). */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
