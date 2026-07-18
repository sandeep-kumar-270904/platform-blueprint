const mongoose = require('mongoose');

const portfolioSectionSchema = new mongoose.Schema({
  type: { type: String, enum: ['about', 'projects', 'experience', 'skills', 'contact', 'custom'], required: true },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  content: mongoose.Schema.Types.Mixed // Flexible depending on type
}, { _id: true });

const portfolioCustomBlockSchema = new mongoose.Schema({
  title: { type: String, required: true },
  richTextContent: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { _id: true });

const portfolioPageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String, required: true, unique: true, index: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  theme: { type: String, default: 'modern' },
  syncMode: { type: String, enum: ['sync-from-resume', 'independent'], default: 'independent' },
  sections: [portfolioSectionSchema],
  customBlocks: [portfolioCustomBlockSchema],
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure a user can only have one portfolio for now (or adjust if multiple allowed, but prompt implies singular personal page)
// Actually, prompt says "a proper personal page... public URL". Usually one per user, but we'll index uniquely by slug anyway.
portfolioPageSchema.index({ slug: 1 }, { unique: true });
portfolioPageSchema.index({ userId: 1 });

module.exports = mongoose.model('PortfolioPage', portfolioPageSchema);
