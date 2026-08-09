const mongoose = require('mongoose');

const ConnectionRequestSchema = new mongoose.Schema({
  requesterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  alumniProfileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AlumniProfile', 
    required: true 
  },
  alumniUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['qa', 'relay', 'session_1on1', 'session_group'], 
    required: true 
  },
  intent: {
    type: String
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'completed'], 
    default: 'pending' 
  },
  message: { 
    type: String, 
    required: true 
  },
  response: { 
    type: String 
  },
  isAnonymous: { 
    type: Boolean, 
    default: false 
  },
  // Optional fields for 1:1 sessions
  requestedDate: { type: Date },
  requestedTime: { type: String }, // e.g. "10:00"

  generatedEventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event' 
  }
}, {
  timestamps: true
});

ConnectionRequestSchema.index({ requesterId: 1, type: 1 });
ConnectionRequestSchema.index({ alumniUserId: 1, status: 1 });
ConnectionRequestSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('ConnectionRequest', ConnectionRequestSchema);
