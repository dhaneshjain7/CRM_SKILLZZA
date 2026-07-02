const mongoose = require('mongoose');
const softDelete = require('./plugins/softDelete');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
    },

    // ── Trigger ───────────────────────────────────────────────────────────────
    triggerType: {
      type: String,
      enum: [
        'Status Updated',
        'New Message',
        'Document Uploaded',
        'Admin Assigned',
        'Password Changed',
        'School Created',
        'Document Approved',
        'Document Rejected',
        'Profile Updated',
        'System',
      ],
      required: true,
    },

    // ── Content ───────────────────────────────────────────────────────────────
    title:   { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    // ── Related entities ──────────────────────────────────────────────────────
    relatedSchool:  { type: mongoose.Schema.Types.ObjectId, ref: 'School',  default: null },
    relatedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    relatedDocument:{ type: mongoose.Schema.Types.ObjectId, ref: 'Document',default: null },

    // ── Delivery ──────────────────────────────────────────────────────────────
    channels: {
      system: { type: Boolean, default: true },
      email:  { type: Boolean, default: false },
    },
    emailSent:   { type: Boolean, default: false },
    emailSentAt: { type: Date,    default: null },

    // ── Read ──────────────────────────────────────────────────────────────────
    isRead: { type: Boolean, default: false },
    readAt: { type: Date,    default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

notificationSchema.plugin(softDelete);

module.exports = mongoose.model('Notification', notificationSchema);
