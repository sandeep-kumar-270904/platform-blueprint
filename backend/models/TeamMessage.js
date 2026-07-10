const mongoose = require('mongoose');

const teamMessageSchema = new mongoose.Schema({
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  message_type: { type: String, default: 'text' },
  file_url: { type: String, default: null },
  is_read: { type: Boolean, default: false },
  reply_to: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMessage', default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeamMessage', teamMessageSchema);
