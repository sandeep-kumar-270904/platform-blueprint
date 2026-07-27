const mongoose = require('mongoose');

const creatorContentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorName: { type: String, required: true },
  creatorAvatar: { type: String },
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['article', 'video', 'project', 'resource'], 
    default: 'article' 
  },
  description: { type: String, default: '' },
  body: { type: String, required: true },
  thumbnail: { type: String, default: '✨' },
  mediaUrl: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['draft', 'in_review', 'published'], 
    default: 'published' 
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reportCount: { type: Number, default: 0 },
  moderationStatus: { type: String, enum: ['normal', 'under_review', 'actioned'], default: 'normal' },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    text: { type: String, required: true },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportCount: { type: Number, default: 0 },
    moderationStatus: { type: String, enum: ['normal', 'under_review', 'actioned'], default: 'normal' },
    replies: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      authorName: { type: String, required: true },
      authorAvatar: { type: String },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  relatedModule: { type: String, enum: ['placement', 'community', 'events', 'quiz', 'none'], default: 'none' },
  relatedItemId: { type: String },
  relatedItemLabel: { type: String },
  lastSavedAt: { type: Date, default: Date.now },
  reviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  communityPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost' }
}, { timestamps: true });

creatorContentSchema.index({ status: 1, createdAt: -1 });
creatorContentSchema.index({ status: 1, type: 1, createdAt: -1 });
creatorContentSchema.index({ status: 1, views: -1, createdAt: -1 });
creatorContentSchema.index({ status: 1, likes: -1, createdAt: -1 });
creatorContentSchema.index({ userId: 1, createdAt: -1 });
creatorContentSchema.index({ userId: 1, type: 1, createdAt: -1 });
creatorContentSchema.index({ userId: 1, views: -1, createdAt: -1 });
creatorContentSchema.index({ userId: 1, likes: -1, createdAt: -1 });
creatorContentSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('CreatorContent', creatorContentSchema);
