function softDeletePlugin(schema) {
  schema.add({
    isDeleted:  { type: Boolean, default: false },
    deletedAt:  { type: Date,    default: null },
    deletedBy:  { type: 'ObjectId', ref: 'User', default: null },

    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date,    default: null },
    archivedBy: { type: 'ObjectId', ref: 'User', default: null },
  });

  // Mongoose v7+ — register each find hook individually (no regex)
  const findHook = function () {
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: false });
    }
  };

  schema.pre('find',        findHook);
  schema.pre('findOne',     findHook);
  schema.pre('findOneAndUpdate', findHook);
  schema.pre('countDocuments',   findHook);
  schema.pre('aggregate',  function () {
    if (!this.options?.includeDeleted) {
      this.pipeline().unshift({ $match: { isDeleted: false } });
    }
  });

  // Instance method: soft delete
  schema.methods.softDelete = async function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
  };

  // Instance method: archive
  schema.methods.archive = async function (userId) {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = userId;
    return this.save();
  };

  // Instance method: restore
  schema.methods.restore = async function () {
    this.isDeleted  = false;
    this.deletedAt  = null;
    this.deletedBy  = null;
    return this.save();
  };
}

module.exports = softDeletePlugin;