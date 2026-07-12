const mongoose = require('mongoose');

const agendaItemSchema = new mongoose.Schema({
  time: String,
  title: String,
  description: String
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  eventType: { 
    type: String, 
    enum: ['hackathon', 'competition', 'workshop', 'seminar'],
    required: true
  },
  bannerImage: { type: String, default: null },
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true },   // e.g. "17:00"
  
  isVirtual: { type: Boolean, default: false },
  venue: { type: String, required: false }, // empty if virtual
  
  hostCollegeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College', 
    required: false,
    default: null
  },

  hostedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostName: { type: String, required: true }, // e.g. "Computer Science Club"
  
  status: { 
    type: String, 
    enum: ['pending_approval', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending_approval'
  },
  
  registrationRequired: { type: Boolean, default: true },
  registrationDeadline: { type: Date, default: null },
  capacity: { type: Number, default: null }, // null = unlimited
  externalRegistrationLink: { type: String, default: null },
  
  // Type-specific optional fields
  teamSize: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 1 }
  }, // for hackathons/competitions
  prizes: [{ type: String }], // for hackathons/competitions
  agenda: [agendaItemSchema], // for workshops/seminars
  rulesDocument: { type: String, default: null },
  
  tags: [{ type: String }],
  
  rejectionReason: { type: String, default: null }, // Added previously possibly but we should make sure it exists, wait, it didn't exist in the file but let's add it if missing. Oh wait, it wasn't in the schema above? Wait, in the previous conversation I did add rejectionReason. I'll add reminded24h and rejectionReason if missing. 
  
  reminded24h: { type: Boolean, default: false },
  
  avgRating: { type: Number, default: 0 },
  totalFeedbackCount: { type: Number, default: 0 },
  
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
