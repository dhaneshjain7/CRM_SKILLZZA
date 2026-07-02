const mongoose = require('mongoose');

// Singleton document — one settings record for the whole platform.
// Super admin can update these via the settings panel.

const settingsSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true, unique: true },  // e.g. "platform.name"
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    label: { type: String },          // human-readable label for admin UI
    group: {
      type: String,
      enum: ['General', 'Email', 'Notifications', 'Security', 'Storage'],
      default: 'General',
    },
    isPublic: { type: Boolean, default: false },  // expose to frontend?
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
