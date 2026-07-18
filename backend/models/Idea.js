const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'general' },
  status: { type: String, enum: ['Idea', 'In Progress', 'Seeking Funding', 'Launched'], default: 'Idea' },
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String }
  }],
  imageAttachments: [{ type: String }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvoteCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  editHistory: [{
    title: String,
    description: String,
    editedAt: { type: Date, default: Date.now }
  }],
  is_public: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Cascade deletes: comments, upvotes, saves
ideaSchema.pre('deleteOne', { document: true, query: false }, async function() {
  await mongoose.model('IdeaComment').deleteMany({ parentIdea: this._id });
  await mongoose.model('IdeaUpvote').deleteMany({ idea: this._id });
  await mongoose.model('IdeaSave').deleteMany({ idea: this._id });
});

ideaSchema.pre('deleteMany', async function() {
  // In a real large app, this might be handled via a job, but for now we'll find matching IDs and delete.
  const docs = await this.model.find(this.getFilter());
  const ids = docs.map(d => d._id);
  await mongoose.model('IdeaComment').deleteMany({ parentIdea: { $in: ids } });
  await mongoose.model('IdeaUpvote').deleteMany({ idea: { $in: ids } });
  await mongoose.model('IdeaSave').deleteMany({ idea: { $in: ids } });
});

module.exports = mongoose.model('Idea', ideaSchema);
