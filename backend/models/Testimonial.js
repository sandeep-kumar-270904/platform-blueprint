const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  clientName: { type: String }, // Optional, can be anonymized
  clientEmail: { type: String, required: true }, // For sending the request
  projectContext: { type: String },
  quote: { type: String },
  
  status: { type: String, enum: ['requested', 'submitted', 'approved', 'rejected'], default: 'requested' },
  requestToken: { type: String, unique: true } // Public token for client to submit
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
