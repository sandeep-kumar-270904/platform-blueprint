const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { 
    name: { type: String, required: true }, 
    logoUrl: { type: String }, 
    verified: { type: Boolean, default: false } 
  },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: String, required: true },
  workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'], required: true },
  jobType: { type: String, enum: ['full-time', 'part-time', 'internship', 'contract'], required: true },
  experienceLevel: { type: String, enum: ['entry', 'mid', 'senior', 'lead'] },
  salary: { 
    min: { type: Number }, 
    max: { type: Number }, 
    currency: { type: String, default: 'INR' }, 
    negotiable: { type: Boolean, default: false } 
  },
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  qualifications: [{ type: String }],
  benefits: [{ type: String }],
  skills: [{ type: String }],
  openings: { type: Number, default: 1 },
  department: { type: String },
  applyMode: { type: String, enum: ['in-app', 'external'], required: true },
  externalUrl: { 
    type: String, 
    required: function() { return this.applyMode === 'external'; } 
  },
  applicationDeadline: { type: Date },
  deadlineReminderSent: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'closed', 'under_review'], default: 'draft' },
  views: { type: Number, default: 0 },
  applicantCount: { type: Number, default: 0 }
}, { timestamps: true });

// Text indexing for search
jobSchema.index({ title: 'text', 'company.name': 'text', skills: 'text' });

module.exports = mongoose.model('Job', jobSchema);
