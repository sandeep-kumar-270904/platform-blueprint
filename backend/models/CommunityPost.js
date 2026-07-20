const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  image_url: { type: String, default: null }, // Legacy
  image_urls: [{ type: String }],
  tags: [{ type: String }],
  is_pinned: { type: Boolean, default: false },
  view_count: { type: Number, default: 0 },
  like_count: { type: Number, default: 0 },
  comment_count: { type: Number, default: 0 },
  edited_at: { type: Date, default: null },
  status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active' },
  report_count: { type: Number, default: 0 },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  link_preview: {
    title: String,
    description: String,
    image: String,
    siteName: String,
    url: String
  },
  poll: {
    options: [{
      text: String,
      votes: { type: Number, default: 0 }
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
