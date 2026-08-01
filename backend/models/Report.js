const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  content_type: { type: String, enum: ['note', 'comment', 'qa_question', 'qa_answer', 'college_question', 'college_answer', 'user', 'mentor', 'mentor_booking', 'forum_thread', 'forum_reply', 'resume', 'cover_letter', 'placement_qa_question', 'placement_qa_answer', 'placement_qa_comment', 'referrer_profile', 'classroom', 'classroom_host', 'study_group', 'group_member', 'group_message', 'repair_provider', 'roommate_profile'], required: true },
  content_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  notes: { type: String, default: null },
  context_data: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
  admin_note: { type: String, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Report', reportSchema);
