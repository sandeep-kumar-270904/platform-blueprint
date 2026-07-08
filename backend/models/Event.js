const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  type: { type: String, default: "workshop" },
  mode: { type: String, default: "online" },
  venue: { type: String, default: null },
  starts_at: { type: Date, required: true },
  ends_at: { type: Date, default: null },
  registration_deadline: { type: Date, default: null },
  capacity: { type: Number, default: 100 },
  registered_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  prize: { type: String, default: null },
  tags: [{ type: String }],
  banner_url: { type: String, default: null },
  featured: { type: Boolean, default: false },
  status: { type: String, default: "published" }
}, { timestamps: true });

// Virtual field for registration_count to match Supabase schema expectation
eventSchema.virtual('registration_count').get(function() {
  return this.registered_users ? this.registered_users.length : 0;
});

// Ensure virtual fields are serialized
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
