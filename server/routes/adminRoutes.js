const express = require('express');
const router  = express.Router();
const {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  toggleAdminActive,
  resetAdminPassword,
} = require('../controllers/adminController');

const { protect }      = require('../middleware/authMiddleware');
const { isSuperAdmin } = require('../middleware/roleMiddleware');

// All routes SuperAdmin only
router.use(protect);
router.use(isSuperAdmin);

router.get('/',                     getAdmins);
router.get('/:id',                  getAdminById);
router.post('/',                    createAdmin);
router.put('/:id',                  updateAdmin);
router.put('/:id/toggle-active',    toggleAdminActive);
router.put('/:id/reset-password',   resetAdminPassword);

module.exports = router;
