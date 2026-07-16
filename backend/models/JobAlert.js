const mongoose = require('mongoose');

const JobAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  criteria: {
    keywords: { type: String, trim: true },
    location: { type: String, trim: true },
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'] },
    jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'] },
    experienceLevel: { type: String, enum: ['entry', 'mid', 'senior', 'director'] },
    minSalary: { type: Number }
  },
  frequency: {
    type: String,
    enum: ['instant', 'daily'],
    default: 'daily'
  },
  active: {
    type: Boolean,
    default: true
  },
  lastNotifiedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JobAlert', JobAlertSchema);
