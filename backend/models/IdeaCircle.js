const mongoose = require('mongoose');

const ideaCircleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'general' },
  isPrivate: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Cascade deletes: when circle is deleted, remove posts
ideaCircleSchema.pre('deleteOne', { document: true, query: false }, async function() {
  await mongoose.model('CirclePost').deleteMany({ circle: this._id });
});

module.exports = mongoose.model('IdeaCircle', ideaCircleSchema);
