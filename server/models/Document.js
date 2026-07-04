const mongoose   = require('mongoose');
const softDelete = require('./plugins/softDelete');
 
const documentSchema = new mongoose.Schema(
  {
    school: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'School',
      required: true,
      index:    true,
    },
 
    uploadedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
    },
 
    // ── File metadata ─────────────────────────────────────────────────────────
    fileName:      { type: String, required: true, trim: true },  // original name
    storedName:    { type: String, required: true },              // UUID name on disk
    filePath:      { type: String, required: true },              // server path
    fileType:      { type: String, required: true },              // mime type
    fileSize:      { type: Number, required: true },              // bytes
    fileExtension: { type: String, required: true, lowercase: true },
 
    // ── Document classification ───────────────────────────────────────────────
    // Includes original CRM types + Adobe deployment upload types from scope
    documentType: {
      type: String,
      enum: [
        // Original CRM document types
        'Registration Certificate',
        'Affiliation Certificate',
        'NOC',
        'Building Plan',
        'Staff List',
        'Fee Structure',
        'Annual Report',
        'Other',
 
        // Adobe deployment CSV/XLS upload types (from PDF scope)
        'school_approval',          // School Approval Format
        'student_data',             // Student Data Format
        'teacher_data',             // Teacher Data Format
        'adobe_student_accounts',   // Adobe Student Accounts (with Name/ID/Password)
        'adobe_teacher_accounts',   // Adobe Teacher Accounts (with Name/ID/Password)
      ],
      default: 'Other',
    },
    description: { type: String, trim: true },
 
    // ── Admin review ──────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['Pending', 'Approved', 'Rejected', 'Re-upload Requested'],
      default: 'Pending',
    },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:   { type: Date,   default: null },
    rejectReason: { type: String, trim: true },
 
    // ── Versioning ────────────────────────────────────────────────────────────
    version:         { type: Number,  default: 1 },
    previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    isLatestVersion: { type: Boolean, default: true },
 
    // ── Parsed CSV/XLS data ───────────────────────────────────────────────────
    // Stores validation result + parsed rows from fileParser.js
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      // Shape: {
      //   valid:     Boolean,
      //   totalRows: Number,
      //   validRows: Number,
      //   errors:    [String],
      //   warnings:  [String],
      //   rows:      [Object],   // validated row data
      // }
    },
  },
  { timestamps: true }
);
 
documentSchema.index({ school: 1, documentType: 1 });
documentSchema.index({ school: 1, isLatestVersion: 1 });
 
documentSchema.plugin(softDelete);
 
module.exports = mongoose.model('Document', documentSchema);
 