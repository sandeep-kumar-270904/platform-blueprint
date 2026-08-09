const mongoose = require('mongoose');

const AlumniRegistrySchema = new mongoose.Schema({
  collegeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College', 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  institutionalEmail: { 
    type: String,
    // Ensure uniqueness within a college
    // unique: true // Handled by a compound index below
  },
  graduationYear: { 
    type: Number, 
    required: true 
  },
  degree: { 
    type: String 
  },
  branch: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['UNCLAIMED', 'CLAIM_PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
    default: 'UNCLAIMED'
  },
  claimedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  claimToken: { 
    type: String,
    default: null,
    // sparse index so we can search by token quickly
    index: { unique: true, sparse: true }
  },
  claimTokenExpiresAt: { 
    type: Date,
    default: null
  },
  claimedAt: { 
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// A college shouldn't have duplicate institutional emails in its registry
AlumniRegistrySchema.index({ collegeId: 1, institutionalEmail: 1 }, { unique: true, partialFilterExpression: { institutionalEmail: { $type: "string" } } });

module.exports = mongoose.model('AlumniRegistry', AlumniRegistrySchema);
