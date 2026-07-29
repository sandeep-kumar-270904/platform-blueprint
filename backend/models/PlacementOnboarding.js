const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  is_completed: { type: Boolean, default: false },
  
  // Auto-verification fields
  auto_verify: { type: Boolean, default: false },
  verify_type: { 
    type: String, 
    enum: ['dsa_easy', 'dsa_medium', 'dsa_hard', 'dsa_any', 'mock_completed', 'resume_updated', 'hr_reviewed', 'none'],
    default: 'none'
  },
  verify_target: { type: Number, default: 0 },
  dynamic_link: { type: String } // e.g. /placement/dsa?difficulty=Easy
});

const phaseSchema = new mongoose.Schema({
  timeframe: { type: String, required: true }, // e.g. "Weeks 1-4"
  title: { type: String, required: true },
  description: { type: String },
  tasks: [taskSchema]
});

const planSchema = new mongoose.Schema({
  version: { type: Number, default: 1 },
  phases: [phaseSchema],
  start_date: { type: Date, default: Date.now },
  current_week: { type: Number, default: 1 }
});

const placementOnboardingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  has_completed: { type: Boolean, default: false },
  
  // User Inputs
  preferences: {
    placement_date: { type: Date },
    study_year: { type: String },
    dsa_comfort: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'None'] },
    has_mock_exp: { type: Boolean, default: false },
    resume_ready: { type: Boolean, default: false },
    target_companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep' }],
    top_priority_companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep' }],
    target_role_type: { type: String },
    weekly_hours: { type: Number, default: 10 }
  },
  
  // Plans History (latest is active)
  plans: [planSchema]
}, { timestamps: true });

// Virtual for active plan (latest version)
placementOnboardingSchema.virtual('active_plan').get(function() {
  if (!this.plans || this.plans.length === 0) return null;
  return this.plans.reduce((latest, current) => current.version > latest.version ? current : latest, this.plans[0]);
});

// Make sure virtuals are included in JSON responses
placementOnboardingSchema.set('toJSON', { virtuals: true });
placementOnboardingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PlacementOnboarding', placementOnboardingSchema);
