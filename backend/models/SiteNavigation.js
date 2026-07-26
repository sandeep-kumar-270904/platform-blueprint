const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema({
  groups: { type: mongoose.Schema.Types.Mixed },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const siteNavigationSchema = new mongoose.Schema({
  versionName: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: false },
  groups: { type: mongoose.Schema.Types.Mixed, default: [] }, // Array of group objects
  revisions: [revisionSchema]
}, { timestamps: true });

module.exports = mongoose.model('SiteNavigation', siteNavigationSchema);
