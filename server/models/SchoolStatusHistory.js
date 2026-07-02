const mongoose = require('mongoose');

// ── Immutable — no soft delete on history records ─────────────────────────────
// Every status change is permanently recorded (scope doc requirement).
// Do NOT apply the softDelete plugin to this model.

const schoolStatusHistorySchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },

    oldStatus: { type: String, default: null },   // null on first entry (creation)
    newStatus: { type: String, required: true },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedByRole: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
      required: true,
    },

    remarks: { type: String, trim: true },  // reason / notes for the change
    reason:  { type: String, trim: true },
  },
  {
    timestamps: true,
    // Prevent any updates — history is append-only
    strict: true,
  }
);

// Compound index for fast timeline queries per school
schoolStatusHistorySchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model('SchoolStatusHistory', schoolStatusHistorySchema);
