const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema({
  content: { type: mongoose.Schema.Types.Mixed },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const siteContentSchema = new mongoose.Schema({
  pageSlug: { type: String, required: true, index: true },
  section: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  revisions: [revisionSchema]
}, { timestamps: true });

// Ensure combination of page and section is unique
siteContentSchema.index({ pageSlug: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
