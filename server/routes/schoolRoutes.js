const express = require('express');
const router  = express.Router();

const {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  updateSchoolStatus,
  assignAdmin,
  archiveSchool,
  getStatusHistory,
  getAuditTrail,
  addNote,
  getStats,
  resetSchoolPassword,
  createSchoolLogin,
} = require('../controllers/schoolController');

const { protect }                                        = require('../middleware/authMiddleware');
const { isSuperAdmin, isAdmin, isSchoolUser, canAccessSchool } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', isAdmin, getStats);

// ── Collection routes ─────────────────────────────────────────────────────────
router.get('/',  getSchools);
router.post('/', isAdmin, createSchool);

// ── Single school routes ──────────────────────────────────────────────────────
router.get('/:id', canAccessSchool, getSchoolById);

// PUT /:id — Admin/SuperAdmin can update anything
//            School user can update their own school profile only
router.put('/:id', canAccessSchool, updateSchool);

// ── Status (Admin only — school user cannot change their own status) ──────────
router.put('/:id/status', isAdmin, canAccessSchool, updateSchoolStatus);

// ── Admin assignment (SuperAdmin only) ───────────────────────────────────────
router.put('/:id/assign-admin', isSuperAdmin, assignAdmin);

// ── Archive (SuperAdmin only) ─────────────────────────────────────────────────
router.put('/:id/archive', isSuperAdmin, archiveSchool);

// ── History & audit ───────────────────────────────────────────────────────────
router.get('/:id/status-history', canAccessSchool, getStatusHistory);
router.get('/:id/audit-trail',    isAdmin, getAuditTrail);

// ── Notes (Admin only) ────────────────────────────────────────────────────────
router.post('/:id/notes', isAdmin, canAccessSchool, addNote);

// ── School Portal Login Management (Admin/SuperAdmin) ─────────────────────────
router.post('/:id/create-login',          isAdmin, createSchoolLogin);       // POST /api/schools/:id/create-login
router.put('/:id/reset-login-password',   isAdmin, resetSchoolPassword);     // PUT  /api/schools/:id/reset-login-password

module.exports = router;
