const express = require('express');
const router  = express.Router();

const {
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
  changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/login',        login);         // POST /api/auth/login
router.post('/google-login', googleLogin);  // POST /api/auth/google-login
router.post('/refresh',      refreshToken);  // POST /api/auth/refresh

// ── Protected routes ──────────────────────────────────────────────────────────
router.post('/logout',          protect, logout);          // POST /api/auth/logout
router.get('/me',               protect, getMe);           // GET  /api/auth/me
router.put('/change-password',  protect, changePassword);  // PUT  /api/auth/change-password

module.exports = router;
