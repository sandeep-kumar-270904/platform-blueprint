const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume_url: { type: String, default: null },
  cover_letter: { type: String, default: null },
  status: { type: String, default: 'applied' } // applied, in-review, accepted, rejected
}, { timestamps: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
