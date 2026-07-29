const mongoose = require('mongoose');

const scholarshipDataSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  apiEndpoint: {
    type: String,
    required: true
  },
  authMethod: {
    type: String,
    enum: ['none', 'api_key', 'oauth2'],
    required: true
  },
  credentialsRef: {
    type: String,
    default: null
  },
  syncFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    required: true
  },
  fieldMapping: {
    type: Object,
    required: true
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  lastSyncStatus: {
    type: String,
    enum: ['success', 'failed', 'partial', 'never_run'],
    default: 'never_run'
  },
  lastSyncErrorDetail: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ScholarshipDataSource', scholarshipDataSourceSchema);

  isStale: { type: Boolean, default: false }, // staleness
