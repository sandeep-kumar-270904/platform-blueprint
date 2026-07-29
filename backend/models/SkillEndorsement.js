const mongoose = require('mongoose');

const skillEndorsementSchema = new mongoose.Schema({
  endorser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endorsee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillName: {
    type: String,
    required: true,
    trim: true
  },
  basedOn: {
    type: String,
    enum: ['completed-session', 'general'],
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillSession',
    required: function() {
      return this.basedOn === 'completed-session';
    }
  }
}, {
  timestamps: true
});

// One endorsement per endorser-endorsee-skillName combo
skillEndorsementSchema.index({ endorser: 1, endorsee: 1, skillName: 1 }, { unique: true });

// Check that endorser !== endorsee
skillEndorsementSchema.pre('save', function(next) {
  if (this.endorser.toString() === this.endorsee.toString()) {
    return next(new Error('You cannot endorse yourself.'));
  }
  next();
});

module.exports = mongoose.model('SkillEndorsement', skillEndorsementSchema);
