const express = require('express');
const router  = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',               getNotifications);   // GET  /api/notifications
router.get('/unread-count',   getUnreadCount);     // GET  /api/notifications/unread-count
router.put('/mark-all-read',  markAllRead);        // PUT  /api/notifications/mark-all-read
router.put('/:id/read',       markRead);           // PUT  /api/notifications/:id/read
router.delete('/:id',         deleteNotification); // DELETE /api/notifications/:id

module.exports = router;
