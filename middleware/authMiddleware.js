const jwt  = require('jsonwebtoken');
const { User } = require('../models');

// ── protect ───────────────────────────────────────────────────────────────────
// Verifies the Bearer access token in the Authorization header.
// Attaches req.user for downstream middleware and controllers.

const protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please refresh your token.',
          code:    'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }

    // Fetch user — confirm they still exist and are active
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

module.exports = { protect };
