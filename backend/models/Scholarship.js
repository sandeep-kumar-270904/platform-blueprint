const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  provider: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    amountType: {
      type: String,
      enum: ['fixed', 'range', 'full_tuition', 'varies'],
      required: true,
    },
    fixedValue: {
      type: Number,
      required: function() { return this.amount && this.amount.amountType === 'fixed'; }
    },
    minValue: {
      type: Number,
      required: function() { return this.amount && this.amount.amountType === 'range'; }
    },
    maxValue: {
      type: Number,
      required: function() { return this.amount && this.amount.amountType === 'range'; }
    }
  },
  eligibility: {
    minGPA: { type: Number },
    majors: [{ type: String }], // empty array = open to any major
    academicLevel: {
      type: [{ type: String, enum: ['undergraduate', 'graduate', 'phd', 'any'] }],
      required: true,
      validate: [v => v.length > 0, 'academicLevel cannot be empty']
    },
    citizenship: [{ type: String }],
    location: [{ type: String }],
    financialNeedRequired: { type: Boolean, default: false },
    otherCriteria: [{ type: String }], // free-text list
    // phase 3/10 extensions
    diversityTags: [{ type: String }],
    isRegional: { type: Boolean, default: false }
  },
  applicationDeadline: {
    type: Date,
    required: true,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  applicationMode: {
    type: String,
    enum: ['in_app', 'external_link'],
    required: true,
  },
  externalUrl: {
    type: String,
    required: function() { return this.applicationMode === 'external_link'; },
    match: [/^https?:\/\/.+/, 'externalUrl must be a valid URL']
  },
  inAppRequirements: {
    type: [{
      fieldKey: { type: String, required: true },
      label: { type: String, required: true },
      fieldType: {
        type: String,
        enum: ['text', 'textarea', 'essay', 'file_upload', 'resume_select', 'recommendation_letter'],
        required: true
      },
      required: { type: Boolean, default: true },
      maxLength: { type: Number },
      essayPromptText: {
        type: String,
        required: function() { return this.fieldType === 'essay'; }
      }
    }],
    required: function() { return this.applicationMode === 'in_app'; },
    validate: {
      validator: function(v) {
        if (this.applicationMode !== 'in_app') return true;
        return v && v.length > 0;
      },
      message: 'inAppRequirements must be non-empty for in_app applicationMode'
    }
  },
  tags: [{
    type: String,
    trim: true,
  }],
  source: {
    type: String,
    enum: ['admin', 'submission', 'api_sync', 'user_submission'],
    required: true,
  },
  dataSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScholarshipDataSource',
    default: null
  },
  originalSourceUrl: {
    type: String,
    required: function() {
      return this.source === 'api_sync' || this.source === 'user_submission';
    }
  },
  needsReview: {
    type: Boolean,
    default: false
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.source === 'submission' || this.source === 'user_submission'; }
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'rejected', 'expired', 'archived'],
    default: 'draft',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNotes: {
    type: String,
  },
  reviewedAt: {
    type: Date,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  saveCount: {
    type: Number,
    default: 0,
  },
  applicationCount: {
    type: Number,
    default: 0,
  },
  
  // Later Phases Fields (retained so they don't break)
  isEmergencyAid: { type: Boolean, default: false },
  isMicroScholarship: { type: Boolean, default: false },
  optInToHiring: { type: Boolean, default: false },
  stackingRules: {
    canCombineWithOthers: { type: Boolean, default: true },
    excludedScholarshipIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }],
    notes: { type: String }
  },
  providerVerification: {
    type: String,
    enum: ['admin_added', 'verified_org', 'verified_institution', 'unverified_submission'],
    default: 'unverified_submission'
  },
  scamFlagMatches: [{ type: String }],
  recurringGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' },
  shareCompetitiveness: { type: Boolean, default: true },
  reports: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    details: { type: String },
    date: { type: Date, default: Date.now }
  }],
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  institutionExclusivity: { type: String, enum: ['none', 'exclusive', 'priority'], default: 'none' },
  linkedJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  fundingPool: {
    totalAmount: { type: Number },
    awardsTarget: { type: Number },
    awardedAmount: { type: Number, default: 0 },
    awardsGranted: { type: Number, default: 0 }
  },
  complianceMetrics: {
    averageSubmissionDays: { type: Number, default: 0 },
    verifiedCount: { type: Number, default: 0 },
    atRiskCount: { type: Number, default: 0 }
  },
  competitionSignal: {
    type: String,
    enum: ['higher_competition', 'moderate_competition', 'limited_data_available'],
    default: 'limited_data_available'
  },
  renewalRequirements: {
    minGPAToMaintain: { type: Number },
    enrollmentStatusRequired: { type: String },
    reportingRequired: { type: Boolean, default: false },
    reportingFrequency: { type: String, enum: ['monthly', 'quarterly', 'annually'] }
  },
  translations: [{
    language: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    translationSource: { type: String, enum: ['gemini', 'manual'], required: true },
    translatedAt: { type: Date }
  }],

  managedByInstitution: { type: Boolean, default: false },
  isEmergencyAid: { type: Boolean, default: false },
  
  // Phase 7: Bulk-Aid
  institutionAllocation: {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
    totalPoolAmount: { 
      type: Number, 
      required: function() { return this.institutionAllocation && this.institutionAllocation.institutionId != null; } 
    },
    remainingPoolAmount: { type: Number },
    intendedAwardCount: { type: Number }
  },
  
  // Phase 7: Localization
  language: { type: String, default: 'en' },

  // Phase 9 & 11: Trust and Staleness
  communityTrustScore: { type: Number, default: 0 },
  isScamFlagged: { type: Boolean, default: false },
  // learning-path field
  learningPathUrl: { type: String },
  subtype: { type: String, enum: ["micro", "full", "partial"] } // Micro-scholarship
}, { timestamps: true });

// Pre-validate hook for emergency aid constraints
scholarshipSchema.pre('validate', function() {
  if (this.isEmergencyAid && this.inAppRequirements && this.inAppRequirements.length > 4) {
    this.invalidate('inAppRequirements', 'Emergency aid scholarships cannot have more than 4 in-app requirements.');
  }
});

// Pre-save to derive providerVerification
scholarshipSchema.pre('save', async function() {
  if (this.isModified('source') || this.isModified('submittedBy') || this.isNew) {
    if (this.source === 'admin') {
      this.providerVerification = 'admin_added';
    } else if (this.source === 'submission' && this.submittedBy) {
      try {
        const User = mongoose.model('User');
        const user = await User.findById(this.submittedBy);
        if (user) {
          if (user.institutionVerified) {
            this.providerVerification = 'verified_institution';
          } else if (user.role === 'recruiter' && user.recruiterProfile && user.recruiterProfile.verificationStatus === 'verified') {
            this.providerVerification = 'verified_org';
          } else {
            this.providerVerification = 'unverified_submission';
          }
        }
      } catch (err) {
        console.error('Error deriving providerVerification', err);
      }
    }
  }
});

// Pre-save to auto-close if pool exhausted or award count reached
scholarshipSchema.pre('save', function() {
  if (this.institutionAllocation && this.institutionAllocation.institutionId) {
    if (this.institutionAllocation.remainingPoolAmount <= 0 && this.status !== 'expired') {
      this.status = 'archived';
    }
  }
});

// Pre-save to enforce fieldKey uniqueness in inAppRequirements
scholarshipSchema.pre('save', function() {
  if (this.applicationMode === 'in_app' && this.inAppRequirements) {
    const keys = this.inAppRequirements.map(req => req.fieldKey);
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      throw new Error('inAppRequirements fieldKeys must be unique');
    }
  }
});

// Indexes
scholarshipSchema.index({ status: 1, applicationDeadline: 1 });
scholarshipSchema.index({ tags: 1 });
scholarshipSchema.index({ source: 1, status: 1 });
scholarshipSchema.index({ 
  title: 'text', 
  provider: 'text', 
  description: 'text' 
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);
