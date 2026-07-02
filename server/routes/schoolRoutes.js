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
} = require('../controllers/schoolController');

const { protect }                              = require('../middleware/authMiddleware');
const { isSuperAdmin, isAdmin, canAccessSchool } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// ── Stats (before /:id to avoid route conflict) ───────────────────────────────
router.get('/stats', isAdmin, getStats);                         // GET  /api/schools/stats

// ── Collection routes ─────────────────────────────────────────────────────────
router.get('/',  getSchools);                                    // GET  /api/schools
router.post('/', isAdmin, createSchool);                         // POST /api/schools

// ── Single school routes ──────────────────────────────────────────────────────
router.get   ('/:id', canAccessSchool, getSchoolById);           // GET  /api/schools/:id
router.put   ('/:id', isAdmin, canAccessSchool, updateSchool);   // PUT  /api/schools/:id

// ── Status ────────────────────────────────────────────────────────────────────
router.put('/:id/status', isAdmin, canAccessSchool, updateSchoolStatus); // PUT /api/schools/:id/status

// ── Admin assignment (SuperAdmin only) ───────────────────────────────────────
router.put('/:id/assign-admin', isSuperAdmin, assignAdmin);      // PUT  /api/schools/:id/assign-admin

// ── Archive (SuperAdmin only) ─────────────────────────────────────────────────
router.put('/:id/archive', isSuperAdmin, archiveSchool);         // PUT  /api/schools/:id/archive

// ── History & audit ───────────────────────────────────────────────────────────
router.get('/:id/status-history', canAccessSchool, getStatusHistory); // GET /api/schools/:id/status-history
router.get('/:id/audit-trail',    isAdmin, getAuditTrail);            // GET /api/schools/:id/audit-trail

// ── Notes (admin-only, not visible to school_user) ────────────────────────────
router.post('/:id/notes', isAdmin, canAccessSchool, addNote);    // POST /api/schools/:id/notes

module.exports = router;
