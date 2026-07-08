const express = require('express');
const router  = express.Router();

const {
  login,
  googleLogin,
  googleLoginAdmin,
  refreshToken,
  logout,
  getMe,
  changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/login',                login);            // POST /api/auth/login
router.post('/google-login',         googleLogin);      // POST /api/auth/google-login         (school_user)
router.post('/google-login/admin',   googleLoginAdmin); // POST /api/auth/google-login/admin
router.post('/refresh',              refreshToken);     // POST /api/auth/refresh

// ── Protected routes ──────────────────────────────────────────────────────────
router.post('/logout',          protect, logout);          // POST /api/auth/logout
router.get('/me',               protect, getMe);           // GET  /api/auth/me
router.put('/change-password',  protect, changePassword);  // PUT  /api/auth/change-password

module.exports = router;

