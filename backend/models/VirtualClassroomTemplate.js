const mongoose = require('mongoose');

const VirtualClassroomTemplateSchema = new mongoose.Schema({
  host_id: { type: String, required: true },
  title: { type: String, required: true },
  subject: { type: String },
  description: { type: String },
  duration_minutes: { type: Number, default: 60 },
  max_participants: { type: Number, default: 50 },
  visibility: { type: String, default: 'public' },
  type: { type: String, default: 'interactive' },
  is_paid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  is_global: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VirtualClassroomTemplate', VirtualClassroomTemplateSchema);
