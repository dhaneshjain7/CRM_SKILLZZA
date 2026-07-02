// ── authorizeRoles ────────────────────────────────────────────────────────────
// Usage: router.get('/route', protect, authorizeRoles('superadmin', 'admin'), controller)
// Always use AFTER protect middleware — req.user must be set first.

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is restricted to: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

// ── Shorthand role guards ─────────────────────────────────────────────────────
const isSuperAdmin  = authorizeRoles('superadmin');
const isAdmin       = authorizeRoles('superadmin', 'admin');
const isSchoolUser  = authorizeRoles('superadmin', 'admin', 'school_user');

// ── School ownership guard ────────────────────────────────────────────────────
// For school_user: ensures they can only access their own school.
// For admin: ensures they can only access their assigned schools.
// For superadmin: passes through.
// Usage: router.get('/schools/:id', protect, canAccessSchool, controller)

const { School } = require('../models');

const canAccessSchool = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const schoolId = req.params.id || req.params.schoolId;

    // Superadmin sees everything
    if (role === 'superadmin') return next();

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found.' });
    }

    if (role === 'admin') {
      if (String(school.assignedAdmin) !== String(_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This school is not assigned to you.',
        });
      }
      return next();
    }

    if (role === 'school_user') {
      if (String(school.schoolUser) !== String(_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own school.',
        });
      }
      return next();
    }

    return res.status(403).json({ success: false, message: 'Access denied.' });
  } catch (err) {
    console.error('canAccessSchool error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  authorizeRoles,
  isSuperAdmin,
  isAdmin,
  isSchoolUser,
  canAccessSchool,
};
