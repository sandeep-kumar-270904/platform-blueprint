const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: function() {
      // password is only required if authProvider is 'local'
      return !this.authProvider || this.authProvider === 'local';
    }
  },
  googleId: { type: String, default: null },
  githubId: { type: String, default: null },
  linkedinId: { type: String, default: null },
  authProvider: { type: String, default: 'local' },
  refreshToken: { type: String, default: null },
  
  // -----------------------------------------
  // Locale Preferences
  // -----------------------------------------
  locale: { type: String, enum: ['en', 'te'], default: 'en' },
  
  // -----------------------------------------
  // Community Moderation & Privacy
  // -----------------------------------------
  muted_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blocked_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  muted_posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost' }],
  clubs: [{ type: String }],
  community_muted: { type: Boolean, default: false },
  community_suspended: { type: Boolean, default: false },
  community_verified: { type: Boolean, default: false },
  
  // -----------------------------------------
  // Security & Settings
  consent: {
    accepted_at: { type: Date },
    terms_version: { type: String },
    ip_address: { type: String }
  },
  knownDevices: [{
    hash: String,
    os: String,
    browser: String,
    region: String,
    last_seen: Date
  }],
  pendingLinkProvider: {
    provider: String,
    id: String,
    expiresAt: Date
  },
  pendingEmail: { type: String, default: null },
  emailChangeToken: { type: String, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },

  full_name: {
    type: String
  },
  bio: {
    type: String
  },
  university: {
    type: String
  },
  graduation_year: {
    type: Number
  },
  degree: {
    type: String
  },
  avatar_url: {
    type: String
  },
  learningStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null }
  },
  quizStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null }
  },
  newsStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null }
  },
  hasCompletedNewsOnboarding: {
    type: Boolean,
    default: false
  },
  badges: [{
    badgeId: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  totalQuizPoints: { type: Number, default: 0 },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  interestTags: [{ type: String, trim: true }],
  skillsProfilePublic: {
    type: Boolean,
    default: false
  },
  skills: [{
    skillName: { type: String, required: true },
    sourceCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
  }],
  verifiedSkills: [{
    skill: { type: String, required: true },
    score: { type: Number },
    verifiedAt: { type: Date, default: Date.now }
  }],
  videoIntroUrl: { type: String },
  videoIntroUploadedAt: { type: Date },
  institutionVerified: { type: Boolean, default: false },
  institutionVerifiedAt: { type: Date },
  lastAnnualReflection: { type: Date }, // Phase 12
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  role: {
    type: String,
    enum: ['user', 'student', 'recruiter', 'admin'],
    default: 'user'
  },
  can_host_classrooms: {
    type: Boolean,
    default: true
  },
  is_verified_host: { type: Boolean, default: false },
  host_verification_status: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified', 'rejected'], 
    default: 'unverified' 
  },
  host_verification_proof: { type: String, default: null },
  gamification_badges: [{
    badge_id: String,
    name: String,
    earned_at: { type: Date, default: Date.now }
  }],
  communityTitle: { type: String, default: null }, // e.g. 'NSS President', 'Club Lead'
  adminRole: {
    type: String,
    enum: ['super', 'moderator', null],
    default: null
  },
  recruiterProfile: {
    companyName: { type: String },
    companyWebsite: { type: String },
    companyLogoUrl: { type: String },
    verificationStatus: { 
      type: String, 
      enum: ['unverified', 'pending', 'verified', 'rejected'], 
      default: 'unverified' 
    },
    verificationDocUrl: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String }
  },
  banned: { type: Boolean, default: false },
  quizBanned: { type: Boolean, default: false },
  teamHuntBanned: { type: Boolean, default: false },
  bannedAt: { type: Date },
  banReason: { type: String },
  savedColleges: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College' 
  }],
  subscribedQuizzes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz' 
  }],
  viewedColleges: [{
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    viewedAt: { type: Date, default: Date.now }
  }],
  savedScholarships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship'
  }],
  savedRoomRentals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomRental'
  }],
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  savedHostels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  }],
  savedRoommates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoommateProfile'
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  },
  careerVisibility: {
    openToWork: { type: Boolean, default: false },
    visibleToRecruiters: { type: Boolean, default: false },
    visiblePreferredRoles: [{ type: String }],
    visiblePreferredLocations: [{ type: String }],
    expectedCTC: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' }
    },
    noticePeriod: { type: String },
    profileLastUpdatedForVisibility: { type: Date },
    profileViewCount: { type: Number, default: 0 },
    profileViewers: [{
      recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now }
    }],
    searchKeywords: [{ type: String }]
  },
  defaultApplicationProfile: {
    resumeUrl: { type: String },
    defaultCoverLetter: { type: String }
  },
  resumeBackupSettings: {
    interval: { type: String, enum: ['none', 'monthly', 'quarterly'], default: 'none' },
    lastBackupAt: { type: Date, default: null }
  },
  notificationPreferences: {
    question_answered: { type: Boolean, default: true },
    review_upvoted: { type: Boolean, default: true },
    answer_upvoted: { type: Boolean, default: true },
    event_reminder: { type: Boolean, default: true },
    event_approved: { type: Boolean, default: true },
    event_rejected: { type: Boolean, default: true },
    event_cancelled_or_changed: { type: Boolean, default: true },
    waitlist_promoted: { type: Boolean, default: true },
    course_reminder: { type: Boolean, default: true },
    course_streak_milestone: { type: Boolean, default: true },
    roomRentals_booking: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' },
    roomRentals_inquiry: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' },
    roomRentals_priceDrop: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' },
    roomRentals_message: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' },
    applicationUpdates: { 
      inApp: { type: Boolean, default: true }, 
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    newApplicants: { 
      inApp: { type: Boolean, default: true }, 
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    scholarships: {
      deadline_reminders: { type: Boolean, default: true },
      weekly_digest: { type: Boolean, default: true },
      recommendation_updates: { type: Boolean, default: true },
      review_outcomes: { type: Boolean, default: true },
      compliance_reminders: { type: Boolean, default: true },
      award_updates: { type: Boolean, default: true }
    },
    accountVerification: { 
      inApp: { type: Boolean, default: true }, 
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    deadlines: { 
      inApp: { type: Boolean, default: true }, 
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    profileViews: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    companyUpdates: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    jobAlerts: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    liveSessionReminders: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    liveSessionResults: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    quizModeration: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    quizChallenges: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    quizTournaments: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    classQuizzes: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    aiQuestionsReview: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    leaderboardActivity: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    mentorUpdates: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    subscriptions: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    communityForums: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    cohorts: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    learningPaths: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    innovationHub: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    roommateConnections: {
      new_requests: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' },
      accepted: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' },
      declined: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' },
      disconnected: { type: String, enum: ['instant', 'digest', 'off'], default: 'instant' }
    }
  },
  newsPreferences: {
    followedCategories: [{ type: String }],
    followedTags: [{ type: String }],
    preferredSources: [{ type: String }],
    mutedSources: [{ type: String }],
    mutedTags: [{ type: String }],
    digestFrequency: { type: String, enum: ['daily', 'weekly', 'off'], default: 'off' },
    followedAuthors: [{ type: String }]
  },
  
  // Referrals & Wallet
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  walletCredit: { type: Number, default: 0 },
  
  webPushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  }],

  // Subscriptions
  subscriptionTier: { type: String, enum: ['free', 'plus', 'pro'], default: 'free' },

  // Phase 11: Scholarship Submissions
  scholarshipSubmissionStats: {
    approvedCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
    spotCheckEligible: { type: Boolean, default: false }
  },
  
  // Phase 14: Skill Swap Trust
  skillSwapNoShowCount: { type: Number, default: 0 },
  skillSwapTrustFlag: { type: String, enum: ['none', 'warned', 'restricted'], default: 'none' },

  // Creators Zone Phase 4: Follow/Unfollow
  creatorFollowers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  creatorFollowing: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mutedCreators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Query helper for privacy
UserSchema.query.visibleCandidates = function() {
  return this.where({ 'careerVisibility.visibleToRecruiters': true });
};

module.exports = mongoose.model('User', UserSchema);
