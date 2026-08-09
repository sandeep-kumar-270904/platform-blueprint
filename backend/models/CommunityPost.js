const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
  parentPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', default: null },
  request_id: { type: String, sparse: true, index: true },
  content: { type: String, required: true },
  image_url: { type: String, default: null }, // Legacy
  image_urls: [{ type: String }],
  tags: [{ type: String }],
  privacy: { type: String, enum: ['public', 'followers', 'club'], default: 'public' },
  club_id: { type: String, default: null },
  template: { type: String, enum: ['standard', 'achievement', 'event', 'question'], default: 'standard' },
  template_data: { type: mongoose.Schema.Types.Mixed },
  is_pinned: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'pending_review', 'hidden', 'deleted'], default: 'active' },
  auto_flag_reason: { type: String, default: null },
  view_count: { type: Number, default: 0 },
  like_count: { type: Number, default: 0 },
  comment_count: { type: Number, default: 0 },
  edited_at: { type: Date, default: null },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  provider_reference: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairProvider', default: null },
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
  },
  category: { type: String, enum: ["question", "experience", "discussion", "opportunity", "poll", "campus_update"], required: true },
  pollOptions: [{
    text: String,
    voteCount: { type: Number, default: 0 }
  }],
  pollVoters: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    optionIndex: Number
  }],
  isAnonymous: { type: Boolean, default: false },
  isOfficial: { type: Boolean, default: false }
}, { timestamps: true });

communityPostSchema.index({ collegeId: 1 });
communityPostSchema.index({ parentPostId: 1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
