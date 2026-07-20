const mongoose = require('mongoose');

// EXPLICIT NOTE: This data is 100% admin-curated.
// There is no scraper, crawler, or scheduled fetch job anywhere touching this endpoint or model.
// All data enters the system purely through manual admin curation.

const alternativeFundingResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['institutional_grant', 'work_study', 'payment_plan', 'government_aid', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  applicableRegions: {
    type: [String],
    default: []
  },
  externalUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

alternativeFundingResourceSchema.index({ category: 1, isActive: 1 });
alternativeFundingResourceSchema.index({ applicableRegions: 1 });

module.exports = mongoose.model('AlternativeFundingResource', alternativeFundingResourceSchema);
