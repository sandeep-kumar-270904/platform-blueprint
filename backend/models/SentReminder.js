const mongoose = require('mongoose');

const sentReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true,
  },
  interval: {
    type: Number,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  }
});

// Ensure we don't send duplicate reminders for the same scholarship + interval + user
sentReminderSchema.index({ userId: 1, scholarshipId: 1, interval: 1 }, { unique: true });

module.exports = mongoose.model('SentReminder', sentReminderSchema);
