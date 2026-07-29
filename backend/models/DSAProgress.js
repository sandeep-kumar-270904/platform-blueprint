const mongoose = require('mongoose');

const dsaProgressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  solved_problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DSAProblem',
  }]
}, { timestamps: true });

module.exports = mongoose.model('DSAProgress', dsaProgressSchema);
