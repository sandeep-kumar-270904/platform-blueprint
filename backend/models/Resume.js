const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: "General Resume" },
  isDefault: { type: Boolean, default: false },
  
  personalInfo: {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    linkedIn: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolioUrl: { type: String, default: "" },
    professionalSummary: { type: String, default: "" }
  },

  education: [{
    institution: { type: String, default: "" },
    degree: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    gpa: { type: String, default: "" },
    relevantCoursework: { type: String, default: "" },
    achievements: [{ type: String }]
  }],

  experience: [{
    company: { type: String, default: "" },
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    isCurrent: { type: Boolean, default: false },
    bulletPoints: [{ type: String }]
  }],

  projects: [{
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    techStack: [{ type: String }],
    liveUrl: { type: String, default: "" },
    repoUrl: { type: String, default: "" },
    bulletPoints: [{ type: String }]
  }],

  skills: [{
    category: { type: String, default: "" }, // e.g., "Languages", "Frameworks"
    items: [{ type: String }]
  }],

  certifications: [{
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    issueDate: { type: String, default: "" },
    expiryDate: { type: String, default: "" },
    credentialUrl: { type: String, default: "" }
  }],

  achievements: [{
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    date: { type: String, default: "" }
  }],

  languages: [{
    name: { type: String, default: "" },
    proficiency: { type: String, default: "" } // e.g., "Native", "Fluent", "Conversational"
  }],

  links: [{
    label: { type: String, default: "" },
    url: { type: String, default: "" }
  }],

  sectionOrder: [{ type: String }], // e.g. ['personalInfo', 'experience', 'education', ...]
  
  template: { type: String, default: "modern" },

  atsScore: {
    score: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date, default: null },
    breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    tips: [{
      issue: String,
      severity: String,
      tip: String
    }]
  },

  sharing: {
    enabled: { type: Boolean, default: false },
    linkId: { type: String }, // unique random string
    expiresAt: { type: Date },
    password: { type: String } // hashed
  },
  
  showAtsScore: { type: Boolean, default: false },
  
  analytics: {
    viewCount: { type: Number, default: 0 },
    exportCount: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 }
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Resume', resumeSchema);
