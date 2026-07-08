const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'general' },
  status: { type: String, enum: ['new', 'in_progress', 'completed', 'rejected'], default: 'new' },
  upvotes: { type: Number, default: 0 },
  tags: [{ type: String }],
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup', default: null },
  is_public: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Idea', ideaSchema);
