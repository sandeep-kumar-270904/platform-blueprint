const mongoose = require('mongoose');

const CollegeAnswerSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CollegeQuestion',
    required: true 
  },
  answeredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  answerText: { 
    type: String, 
    required: true,
    trim: true
  },
  isCurrentStudent: { 
    type: Boolean, 
    default: false 
  },
  upvotes: { 
    type: Number, 
    default: 0 
  },
  upvotedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('CollegeAnswer', CollegeAnswerSchema);
