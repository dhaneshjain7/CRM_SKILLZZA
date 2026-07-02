const mongoose = require('mongoose');
const softDelete = require('./plugins/softDelete');

const documentSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
    },

    // ── File metadata ─────────────────────────────────────────────────────────
    fileName:     { type: String, required: true, trim: true },   // original name
    storedName:   { type: String, required: true },               // UUID name on disk
    filePath:     { type: String, required: true },               // server path
    fileType:     { type: String, required: true },               // mime type
    fileSize:     { type: Number, required: true },               // bytes
    fileExtension:{ type: String, required: true, lowercase: true },

    // ── Document classification ───────────────────────────────────────────────
    documentType: {
      type: String,
      enum: [
        'Registration Certificate',
        'Affiliation Certificate',
        'NOC',
        'Building Plan',
        'Staff List',
        'Fee Structure',
        'Annual Report',
        'Other',
      ],
      default: 'Other',
    },
    description: { type: String, trim: true },

    // ── Admin review ──────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Re-upload Requested'],
      default: 'Pending',
    },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:  { type: Date, default: null },
    rejectReason:{ type: String, trim: true },

    // ── Versioning ────────────────────────────────────────────────────────────
    // Every re-upload is a new document record; previousVersion links the chain
    version:         { type: Number, default: 1 },
    previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    isLatestVersion: { type: Boolean, default: true },
  },
  { timestamps: true }
);

documentSchema.index({ school: 1, documentType: 1 });
documentSchema.index({ school: 1, isLatestVersion: 1 });

documentSchema.plugin(softDelete);

module.exports = mongoose.model('Document', documentSchema);
