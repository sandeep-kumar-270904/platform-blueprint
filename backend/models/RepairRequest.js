const mongoose = require('mongoose');

const RepairRequestSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairProvider',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDescription: {
    type: String,
    required: true,
    trim: true
  },
  quickIssueCategory: {
    type: String,
    default: null
  },
  preferredDate: {
    type: Date,
    required: false
  },
  preferredTime: {
    type: String, // "HH:mm" or "ASAP"
    required: true
  },
  isAsap: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  contactSnapshot: {
    phone: { type: String, required: true },
    email: { type: String }
  },
  photoUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: ''
  },
  dashboardPromptDismissed: {
    type: Boolean,
    default: false
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled']
      },
      systemNote: {
        type: String
      },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ]
}, { timestamps: true });

// Indexes for fast lookup
RepairRequestSchema.index({ userId: 1, createdAt: -1 });
RepairRequestSchema.index({ providerId: 1, status: 1 });
RepairRequestSchema.index({ userId: 1, providerId: 1, status: 1 }); // Optimize checking existing requests for a specific provider

module.exports = mongoose.model('RepairRequest', RepairRequestSchema);
