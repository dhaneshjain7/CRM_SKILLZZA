const express = require('express');
const router  = express.Router();
const {
  sendMessage,
  getMessages,
  markRead,
  pinMessage,
  getPinnedMessages,
  getUnreadCount,
  getConversations,
} = require('../controllers/messageController');

const { protect }     = require('../middleware/authMiddleware');
const { isSchoolUser } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/conversations',               getConversations);       // GET  /api/messages/conversations
router.get('/unread-count',                getUnreadCount);         // GET  /api/messages/unread-count
router.post('/send',                       sendMessage);            // POST /api/messages/send
router.get('/school/:schoolId',            getMessages);            // GET  /api/messages/school/:schoolId
router.get('/school/:schoolId/pinned',     getPinnedMessages);      // GET  /api/messages/school/:schoolId/pinned
router.put('/:id/read',                    markRead);               // PUT  /api/messages/:id/read
router.put('/:id/pin',                     pinMessage);             // PUT  /api/messages/:id/pin

module.exports = router;
