const mongoose = require('mongoose');

const gdLiveSessionSchema = new mongoose.Schema({
  studyGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup', required: true, index: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicTitle: { type: String, required: true }, // Can be custom or reference to a GDTopic title
  
  scheduledTime: { type: Date, required: true },
  meetingLink: { type: String },
  
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  
  rsvps: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Attending', 'Not Attending'] },
    rsvpAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('GDLiveSession', gdLiveSessionSchema);
