const mongoose = require('mongoose');
const softDelete = require('./plugins/softDelete');

const messageSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverRole: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
      required: true,
    },

    // ── Content ───────────────────────────────────────────────────────────────
    messageType: {
      type: String,
      enum: ['text', 'image', 'pdf', 'word', 'excel', 'other'],
      default: 'text',
    },
    content:  { type: String, trim: true },  // text content

    // ── Attachment (if messageType !== 'text') ────────────────────────────────
    attachment: {
      fileName:  { type: String },
      storedName:{ type: String },
      filePath:  { type: String },
      fileType:  { type: String },
      fileSize:  { type: Number },
    },

    // ── Read receipt ──────────────────────────────────────────────────────────
    isRead:  { type: Boolean, default: false },
    readAt:  { type: Date,    default: null },

    // ── Pin ───────────────────────────────────────────────────────────────────
    isPinned:   { type: Boolean, default: false },
    pinnedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pinnedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

// Fast conversation queries
messageSchema.index({ school: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });

// Messages are never permanently deleted — only archived
messageSchema.plugin(softDelete);

module.exports = mongoose.model('Message', messageSchema);
