const mongoose = require('mongoose');

const eventAttendanceSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checked_in_at: { type: Date, default: Date.now },
  method: { type: String, default: "web" }
}, { timestamps: true });

// Prevent duplicate check-ins
eventAttendanceSchema.index({ event_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('EventAttendance', eventAttendanceSchema);
