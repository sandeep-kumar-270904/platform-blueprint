const mongoose = require('mongoose');

const providerFeedbackSchema = new mongoose.Schema({
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScholarshipApplication',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wasClear: {
    type: Boolean,
    required: true
  },
  requirementsAccurate: {
    type: Boolean,
    required: true
  },
  confusingSteps: {
    type: String,
    default: null
  }
}, { timestamps: true });

providerFeedbackSchema.index({ scholarshipId: 1 });

module.exports = mongoose.model('ProviderFeedback', providerFeedbackSchema);
