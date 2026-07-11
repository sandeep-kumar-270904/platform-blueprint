const mongoose = require('mongoose');

const CollegeQuestionSchema = new mongoose.Schema({
  collegeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College',
    required: true 
  },
  askedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  questionText: { 
    type: String, 
    required: true,
    trim: true
  },
  upvotes: { 
    type: Number, 
    default: 0 
  },
  upvotedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  status: { 
    type: String, 
    enum: ['open', 'answered'], 
    default: 'open' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CollegeQuestion', CollegeQuestionSchema);
