const mongoose = require('mongoose');

const GroupSessionSchema = new mongoose.Schema({
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
    index: true
  },
  creator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  format: {
    type: String,
    trim: true,
    maxlength: 50
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  scheduled_at: {
    type: Date,
    required: true
  },
  duration_minutes: {
    type: Number,
    required: true,
    default: 60,
    min: 15,
    max: 300
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('GroupSession', GroupSessionSchema);
