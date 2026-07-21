const mongoose = require('mongoose');

const dsaProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  topic: {
    type: String,
    required: true,
    index: true,
  },
  companies: [{
    type: String,
  }],
  link: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('DSAProblem', dsaProblemSchema);
