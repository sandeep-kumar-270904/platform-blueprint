const mongoose = require('mongoose');

const classRosterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  joinCode: { type: String, required: true, unique: true }
}, { timestamps: true });

classRosterSchema.index({ teacherId: 1 });

module.exports = mongoose.model('ClassRoster', classRosterSchema);
