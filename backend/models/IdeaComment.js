const mongoose = require('mongoose');

const ideaCommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentIdea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'IdeaComment', default: null }, // for threaded replies
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// When a comment is deleted, also delete its replies
ideaCommentSchema.pre('deleteOne', { document: true, query: false }, async function() {
  await mongoose.model('IdeaComment').deleteMany({ parentComment: this._id });
});

module.exports = mongoose.model('IdeaComment', ideaCommentSchema);
