const mongoose = require('mongoose');

const applicantFeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scholarshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship', required: true },
  providerName: { type: String, required: true },
  clarityRating: { type: Number, required: true, min: 1, max: 5 },
  confusingSteps: [{ type: String }],
  comments: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApplicantFeedback', applicantFeedbackSchema);
