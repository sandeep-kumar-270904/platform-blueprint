const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  idea_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: null },
  requested_role: { type: String, default: null },
  status: { type: String, default: 'pending' }, // 'pending', 'accepted', 'rejected'
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
