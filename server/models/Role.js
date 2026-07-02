const mongoose = require('mongoose');
const softDelete = require('./plugins/softDelete');

// Stores the three roles + their metadata.
// Seeded on first run — not user-editable in v1.

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
      required: true,
      unique: true,
    },
    displayName: { type: String, required: true },  // e.g. "Super Admin"
    description: { type: String },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

roleSchema.plugin(softDelete);

module.exports = mongoose.model('Role', roleSchema);
