const { Message, School, User, Notification } = require('../models');

// ── Helper: emit socket event ─────────────────────────────────────────────────
const emit = (req, room, event, data) => {
  req.app.get('io')?.to(room).emit(event, data);
};

// ── @POST /api/messages/send ──────────────────────────────────────────────────
// Send a message — Admin → School or School → Admin
const sendMessage = async (req, res) => {
  try {
    const { schoolId, content, messageType = 'text' } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId is required.' });
    }
    if (!content && messageType === 'text') {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found.' });
    }

    // Determine sender/receiver
    const sender   = req.user;
    let receiverId, receiverRole;

    if (sender.role === 'school_user') {
      // School user messages their assigned admin
      receiverId   = school.assignedAdmin;
      receiverRole = 'admin';
      if (!receiverId) {
        return res.status(400).json({ success: false, message: 'No admin assigned to this school yet.' });
      }
    } else {
      // Admin/SuperAdmin messages the school user
      receiverId   = school.schoolUser;
      receiverRole = 'school_user';
      if (!receiverId) {
        return res.status(400).json({ success: false, message: 'No school user linked to this school.' });
      }
    }

    const message = await Message.create({
      school:       schoolId,
      sender:       sender._id,
      senderRole:   sender.role,
      receiver:     receiverId,
      receiverRole,
      messageType,
      content:      content?.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate('sender',   'name email role photo')
      .populate('receiver', 'name email role');

    // Emit via Socket.io to the school room
    const room = `school_${schoolId}`;
    emit(req, room, 'new_message', populated);

    // Also emit to receiver's personal room
    emit(req, `user_${receiverId}`, 'new_message', populated);

    // Create notification for receiver
    await Notification.create({
      recipient:      receiverId,
      recipientRole:  receiverRole,
      triggerType:    'New Message',
      title:          `New message from ${sender.name}`,
      message:        content?.substring(0, 100) || 'New message',
      relatedSchool:  schoolId,
      relatedMessage: message._id,
      channels:       { system: true, email: false },
    });

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @GET /api/messages/school/:schoolId ──────────────────────────────────────
// Get all messages for a school conversation
const getMessages = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { page = 1, limit = 50, search } = req.query;

    const filter = { school: schoolId };
    if (search) {
      filter.content = new RegExp(search, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate('sender',   'name email role photo')
        .populate('receiver', 'name email role')
        .sort({ createdAt: 1 }) // oldest first for chat display
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments(filter),
    ]);

    // Mark unread messages as read for the current user
    await Message.updateMany(
      { school: schoolId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Emit read receipts
    emit(req, `school_${schoolId}`, 'messages_read', {
      schoolId,
      readBy: req.user._id,
      readAt: new Date(),
    });

    res.status(200).json({
      success: true,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      messages,
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @PUT /api/messages/:id/read ───────────────────────────────────────────────
const markRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    emit(req, `school_${message.school}`, 'message_read', {
      messageId: message._id,
      readBy:    req.user._id,
      readAt:    message.readAt,
    });

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @PUT /api/messages/:id/pin ────────────────────────────────────────────────
const pinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    message.isPinned = !message.isPinned;
    message.pinnedBy = message.isPinned ? req.user._id : null;
    message.pinnedAt = message.isPinned ? new Date() : null;
    await message.save();

    emit(req, `school_${message.school}`, 'message_pinned', {
      messageId: message._id,
      isPinned:  message.isPinned,
      pinnedBy:  req.user.name,
    });

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @GET /api/messages/school/:schoolId/pinned ────────────────────────────────
const getPinnedMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      school:    req.params.schoolId,
      isPinned:  true,
    })
      .populate('sender', 'name role')
      .sort({ pinnedAt: -1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @GET /api/messages/unread-count ──────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead:   false,
    });
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @GET /api/messages/conversations ─────────────────────────────────────────
// List all conversations for the current user (one per school)
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role;

    // Find all schools this user is part of
    let schoolFilter = {};
    if (role === 'admin')       schoolFilter = { assignedAdmin: userId };
    if (role === 'school_user') schoolFilter = { schoolUser: userId };

    const { School } = require('../models');
    const schools = role === 'superadmin'
      ? await School.find({}).limit(50)
      : await School.find(schoolFilter);

    const conversations = await Promise.all(
      schools.map(async (school) => {
        const lastMessage = await Message.findOne({ school: school._id })
          .populate('sender', 'name role')
          .sort({ createdAt: -1 });

        const unread = await Message.countDocuments({
          school:   school._id,
          receiver: userId,
          isRead:   false,
        });

        return {
          school:      { _id: school._id, schoolName: school.schoolName, currentStatus: school.currentStatus },
          lastMessage,
          unreadCount: unread,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      const ta = a.lastMessage?.createdAt || 0;
      const tb = b.lastMessage?.createdAt || 0;
      return new Date(tb) - new Date(ta);
    });

    res.status(200).json({ success: true, conversations });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markRead,
  pinMessage,
  getPinnedMessages,
  getUnreadCount,
  getConversations,
};
