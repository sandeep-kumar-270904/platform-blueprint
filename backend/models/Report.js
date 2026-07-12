const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  content_type: { type: String, enum: ['note', 'comment', 'qa_question', 'qa_answer', 'college_question', 'college_answer'], required: true },
  content_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
  admin_note: { type: String, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Report', reportSchema);
