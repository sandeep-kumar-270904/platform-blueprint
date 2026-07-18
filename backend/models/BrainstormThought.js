const mongoose = require('mongoose');

const brainstormThoughtSchema = new mongoose.Schema({
  content: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'BrainstormSession', required: true },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('BrainstormThought', brainstormThoughtSchema);
