const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  quiz: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  hostedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  scheduledStartAt: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'waiting_room', 'in_progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  joinCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  pacingMode: {
    type: String,
    enum: ['host', 'self'],
    default: 'host'
  },
  opensAt: { type: Date },
  closesAt: { type: Date },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    currentQuestionIndex: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    answers: [{
      questionIndex: Number,
      selectedOptionIndex: Number,
      isCorrect: Boolean,
      answeredAt: Date,
      timeTakenSeconds: Number
    }],
    status: { type: String, enum: ['waiting', 'active', 'finished', 'disconnected'], default: 'waiting' }
  }],
  currentQuestionIndex: { 
    type: Number, 
    default: -1 
  },
  questionStartedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

liveSessionSchema.index({ joinCode: 1 }, { unique: true });
liveSessionSchema.index({ quiz: 1, status: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
