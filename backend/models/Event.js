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
    enum: ['hackathon', 'competition', 'workshop', 'seminar', 'community_content'],
    required: true
  },
  bannerImage: { type: String, default: null },
  
  isExternalContent: { type: Boolean, default: false },
  
  startDate: { type: Date, required: function() { return !this.isExternalContent; } },
  endDate: { type: Date, required: function() { return !this.isExternalContent; } },
  startTime: { type: String, required: function() { return !this.isExternalContent; } }, // e.g. "09:00"
  endTime: { type: String, required: function() { return !this.isExternalContent; } },   // e.g. "17:00"
  
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
    enum: ['pending_approval', 'approved', 'rejected', 'cancelled'],
    default: 'pending_approval'
  },
  
  lifecycleStatus: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'archived'],
    default: 'upcoming'
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
      enum: ['INTERNAL', 'EXTERNAL_API', 'COLLEGE_FEED', 'ORGANIZER_FEED', 'PARTNER', 'DEV_COMMUNITY'],
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
eventSchema.index({ status: 1, lifecycleStatus: 1, startDate: 1, endDate: 1 }); // For cron job optimization
eventSchema.index({ 'source.provider': 1, 'source.externalEventId': 1 }); // For external event deduplication
eventSchema.index({ title: 'text', tags: 'text' }); // For text search optimization

module.exports = mongoose.model('Event', eventSchema);
