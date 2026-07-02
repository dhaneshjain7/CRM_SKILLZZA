const mongoose = require('mongoose');
const softDelete = require('./plugins/softDelete');

// Mirrors the Role Permissions Matrix from scope doc section 20.
// Can be used to dynamically check access without hardcoding in middleware.

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'school_user'],
      required: true,
    },

    feature: {
      type: String,
      enum: [
        'View All Schools',
        'Manage Admin',
        'Manage School',
        'Update Status',
        'Chat',
        'Upload Documents',
        'Reports',
        'Activity Logs',
        'Dashboard',
      ],
      required: true,
    },

    // Access level — matches the scope doc matrix values
    access: {
      type: String,
      enum: ['Yes', 'No', 'Assigned Only', 'Limited', 'Own'],
      required: true,
    },
  },
  { timestamps: true }
);

permissionSchema.index({ role: 1, feature: 1 }, { unique: true });
permissionSchema.plugin(softDelete);

module.exports = mongoose.model('Permission', permissionSchema);
