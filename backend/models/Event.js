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
  
  rejectionReason: { type: String, default: null },
  
  reminded24h: { type: Boolean, default: false },
  
  avgRating: { type: Number, default: 0 },
  totalFeedbackCount: { type: Number, default: 0 },
  
  timezone: { type: String, default: 'UTC' }, // New field for robust date handling
  draft: { type: Boolean, default: false }, // New field for creation wizard
  
  registrationCount: { type: Number, default: 0 }, // Tracks registered attendees atomically
  
  source: {
    provider: { 
      type: String, 
      enum: ['INTERNAL', 'EXTERNAL_API', 'COLLEGE_FEED', 'ORGANIZER_FEED', 'PARTNER'],
      default: 'INTERNAL'
    },
    externalEventId: { type: String, default: null },
    externalUrl: { type: String, default: null },
    importedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null },
    syncStatus: { type: String, default: 'HEALTHY' }
  }
  
}, { timestamps: true });

eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ hostedBy: 1 });
eventSchema.index({ status: 1, endDate: 1 }); // For cron job optimization
eventSchema.index({ 'source.provider': 1, 'source.externalEventId': 1 }); // For external event deduplication
eventSchema.index({ title: 'text', tags: 'text' }); // For text search optimization

module.exports = mongoose.model('Event', eventSchema);
