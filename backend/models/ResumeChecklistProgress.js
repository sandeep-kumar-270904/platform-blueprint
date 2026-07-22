const mongoose = require('mongoose');

const ResumeChecklistProgressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  checkedItems: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('ResumeChecklistProgress', ResumeChecklistProgressSchema);
