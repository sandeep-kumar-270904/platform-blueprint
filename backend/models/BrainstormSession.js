const mongoose = require('mongoose');

const brainstormSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'general' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'archived'], default: 'open' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// When a brainstorm session is deleted, we might delete its thoughts (but the prompt says archiving preserves them, deleting them is only if cascading deletes happen. We'll add standard cascade just in case)
brainstormSessionSchema.pre('deleteOne', { document: true, query: false }, async function() {
  await mongoose.model('BrainstormThought').deleteMany({ session: this._id });
});

module.exports = mongoose.model('BrainstormSession', brainstormSessionSchema);
