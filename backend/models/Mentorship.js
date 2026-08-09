const mongoose = require('mongoose');

const mentorshipGoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const mentorshipSchema = new mongoose.Schema({
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The Alumni's User ID
  alumniProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlumniProfile', required: true },
  
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'], 
    default: 'active' 
  },
  
  goals: [mentorshipGoalSchema],
  
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  
  notes: { type: String }, // Internal notes or progress
  
}, { timestamps: true });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
