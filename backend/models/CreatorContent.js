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
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'published' 
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [{ type: String }]
}, { timestamps: true });

creatorContentSchema.index({ status: 1, createdAt: -1 });
creatorContentSchema.index({ userId: 1 });

module.exports = mongoose.model('CreatorContent', creatorContentSchema);
