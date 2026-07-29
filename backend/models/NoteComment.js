const mongoose = require('mongoose');

const commentVoteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NoteComment', required: true },
  vote_type: { type: String, enum: ['up', 'down'], required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

commentVoteSchema.index({ user_id: 1, comment_id: 1 }, { unique: true });

const CommentVote = mongoose.model('CommentVote', commentVoteSchema);

const noteCommentSchema = new mongoose.Schema({
  note_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NoteComment', default: null },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  is_helpful: { type: Boolean, default: false },
  is_reported: { type: Boolean, default: false },
  is_edited: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const NoteComment = mongoose.model('NoteComment', noteCommentSchema);

module.exports = {
  NoteComment,
  CommentVote
};
