const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const InterviewSession = require('../models/InterviewSession');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Notification = require('../models/Notification');

const SkillCluster = require('../models/SkillCluster');
const CertificationRecord = require('../models/CertificationRecord');
const User = require('../models/User');

exports.panicRebuild = async (req, res) => {
  try {
    const { targetRole, focus, topSkills } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const resumeContext = {
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects
    };

    const restructuredData = await geminiService.panicRebuild(resumeContext, targetRole, focus, topSkills, req.user.id);

    const panicVariant = new Resume({
      ...resume.toObject(),
      _id: undefined,
      title: `[Panic Mode] ${targetRole} - ${resume.title}`,
      variantType: 'panic_mode',
      summary: restructuredData.summary,
      experience: restructuredData.experience || [],
      education: restructuredData.education || [],
      skills: restructuredData.skills || [],
      projects: restructuredData.projects || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await panicVariant.save();

    res.json(panicVariant);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSkillClusters = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('verifiedSkills');
    const certs = await CertificationRecord.find({ user: req.user.id, status: 'verified' });
    
    // Normalize user's verified items
    const userSkills = new Set([
      ...(user.verifiedSkills || []).map(s => s.toLowerCase()),
      ...certs.map(c => c.name.toLowerCase())
    ]);

    const allClusters = await SkillCluster.find();
    const unlocked = [];

    for (const cluster of allClusters) {
      let matchCount = 0;
      for (const reqTag of cluster.requiredTags) {
        if (userSkills.has(reqTag.toLowerCase())) {
          matchCount++;
        }
      }
      
      // If user has 3+ matching verified skills/certs for this cluster
      if (matchCount >= 3) {
        unlocked.push(cluster);
      }
    }

    res.json(unlocked);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const ResumeVersion = require('../models/ResumeVersion');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

// Get all resumes for user

const mongoose = require('mongoose');

// Tailor resume for a job
exports.tailorResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobId, jobDescription } = req.body;
    
    const originalResume = await Resume.findById(id);
    if (!originalResume || originalResume.user_id.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Clone the resume
    const tailoredResume = new Resume(originalResume.toObject());
    tailoredResume._id = new mongoose.Types.ObjectId();
    tailoredResume.isNew = true;
    tailoredResume.title = `${originalResume.title} (Tailored)`;
    tailoredResume.isDefault = false;
    tailoredResume.tailoredForJobId = jobId;
    
    // Get suggestions
    let descriptionToUse = jobDescription;
    if (jobId && !jobDescription) {
      const job = await Job.findById(jobId);
      if (job) descriptionToUse = job.description;
    }

    if (descriptionToUse) {
      const suggestions = await geminiService.generateTailoringSuggestions(originalResume, descriptionToUse, req.user.id);
      tailoredResume.tailorSuggestions = suggestions.map(s => ({ ...s, status: 'pending' }));
    }

    await tailoredResume.save();
    res.json(tailoredResume);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const isArchived = req.query.archived === 'true';
    const resumes = await Resume.find({ user_id: req.user.id, isArchived: isArchived ? true : { $ne: true } }).sort({ updated_at: -1 });
    res.json(resumes);
  } catch (error) {
    logger.error('Error fetching resumes:', error);
    res.status(500).json({ message: 'Server error fetching resumes', error: error.message });
  }
};

// Get single resume
exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new resume
exports.createResume = async (req, res) => {
  try {
    const { title, template, isDefault } = req.body;
    
    // If setting as default, unset others
    if (isDefault) {
      await Resume.updateMany({ user_id: req.user.id }, { isDefault: false });
    }

    const resumeCount = await Resume.countDocuments({ user_id: req.user.id });
    
    const newResume = new Resume({
      user_id: req.user.id,
      title: title || `Resume ${resumeCount + 1}`,
      template: template || 'modern',
      isDefault: isDefault || (resumeCount === 0), // First resume is default
      sectionOrder: ['personalInfo', 'professionalSummary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'languages', 'links']
    });

    await newResume.save();
    res.status(201).json(newResume);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

// Update resume (autosave)
exports.updateResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    // Ensure we don't accidentally update user_id or atsScore through generic update
    delete req.body.user_id;
    delete req.body.atsScore; 
    
    if (req.body.isDefault) {
      await Resume.updateMany({ user_id: req.user.id }, { isDefault: false });
    }

    Object.assign(resume, req.body);
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();
    
    res.json(resume);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

// Duplicate resume
exports.duplicateResume = async (req, res) => {
  try {
    const original = await Resume.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Resume not found' });
    if (original.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.created_at;
    delete duplicateData.updated_at;
    duplicateData.title = `${duplicateData.title} (Copy)`;
    duplicateData.isDefault = false; // duplicated resumes are not default

    const duplicate = new Resume(duplicateData);
    await duplicate.save();
    
    res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete resume
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await resume.deleteOne();
    res.json({ message: 'Resume deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Set Default Resume
exports.setDefaultResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await Resume.updateMany({ user_id: req.user.id }, { isDefault: false });
    resume.isDefault = true;
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();
    
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Score Resume via Gemini
exports.scoreResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const atsResult = await geminiService.scoreResume(resume.toObject(), req.user.id);
    
    resume.atsScore = {
      score: atsResult.score,
      breakdown: atsResult.breakdown,
      tips: atsResult.tips,
      lastCalculatedAt: new Date()
    };
    
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();

    // Create Version Snapshot on explicit score/save
    const versionCount = await ResumeVersion.countDocuments({ resumeId: resume._id });
    const newVersion = new ResumeVersion({
      resumeId: resume._id,
      versionNumber: versionCount + 1,
      snapshotData: resume.toObject(),
      atsScoreAtVersion: resume.atsScore
    });
    await newVersion.save();

    // Prune versions to max 20
    if (versionCount + 1 > 20) {
      const oldestVersions = await ResumeVersion.find({ resumeId: resume._id })
        .sort({ versionNumber: 1 })
        .limit((versionCount + 1) - 20);
      
      for (const ov of oldestVersions) {
        await ov.deleteOne();
      }
    }

    res.json(resume.atsScore);
  } catch (error) {
    logger.error('Error scoring resume:', error);
    res.status(503).json({ message: error.message || 'Scoring temporarily unavailable, try again' });
  }
};

// Get version history
exports.getVersions = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const versions = await ResumeVersion.find({ resumeId: resume._id }).sort({ versionNumber: -1 });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching versions', error: error.message });
  }
};

// Restore a version
exports.restoreVersion = async (req, res) => {
  try {
    const { id, vid } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const version = await ResumeVersion.findById(vid);
    if (!version || version.resumeId.toString() !== id) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Backup current state as a new version before restoring
    const versionCount = await ResumeVersion.countDocuments({ resumeId: resume._id });
    await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: versionCount + 1,
      snapshotData: resume.toObject(),
      atsScoreAtVersion: resume.atsScore
    });

    // Restore
    const snapshot = version.snapshotData;
    delete snapshot._id;
    delete snapshot.user_id;
    delete snapshot.created_at;
    delete snapshot.updated_at;

    Object.assign(resume, snapshot);
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();

    res.json({ message: 'Version restored successfully', resume });
  } catch (error) {
    res.status(500).json({ message: 'Server error restoring version', error: error.message });
  }
};

// Toggle Sharing
exports.toggleSharing = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { enabled, password, expiresAt } = req.body;

    if (!resume.sharing) {
      resume.sharing = {};
    }

    resume.sharing.enabled = enabled;
    
    if (enabled && !resume.sharing.linkId) {
      const crypto = require('crypto');
      resume.sharing.linkId = crypto.randomBytes(8).toString('hex');
    }

    if (password) {
      const bcrypt = require('bcryptjs');
      resume.sharing.password = await bcrypt.hash(password, 10);
    }

    if (expiresAt) {
      resume.sharing.expiresAt = new Date(expiresAt);
    }

    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();
    res.json({ sharing: resume.sharing });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating sharing settings', error: error.message });
  }
};

// Get Shared Resume (Public)
exports.getSharedResume = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { password } = req.body;

    const resume = await Resume.findOne({ 'sharing.linkId': linkId });
    if (!resume || !resume.sharing?.enabled) {
      return res.status(404).json({ message: 'Resume not found or sharing is disabled' });
    }

    if (resume.sharing.expiresAt && new Date() > resume.sharing.expiresAt) {
      return res.status(404).json({ message: 'This link has expired' });
    }

    if (resume.sharing.password) {
      if (!password) {
        return res.status(401).json({ message: 'Password required' });
      }
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, resume.sharing.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    }

    // Track views
    resume.analytics = resume.analytics || {};
    resume.analytics.viewCount = (resume.analytics.viewCount || 0) + 1;

    // Track QR scan source
    if (req.query.source === 'qr_scan') {
      resume.analytics.qrScans = (resume.analytics.qrScans || 0) + 1;
    }
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();

    // Sanitize response
    const sanitizedResume = resume.toObject();
    delete sanitizedResume.user_id;
    delete sanitizedResume.sharing.password;

    if (!sanitizedResume.showAtsScore) {
      delete sanitizedResume.atsScore;
    }

    res.json({ resume: sanitizedResume });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching shared resume', error: error.message });
  }
};

exports.getSharedResumeQR = async (req, res) => {
  try {
    const { linkId } = req.params;
    const resume = await Resume.findOne({ 'sharing.linkId': linkId });
    if (!resume || !resume.sharing?.enabled) {
      return res.status(404).json({ message: 'Resume not found or sharing is disabled' });
    }

    if (resume.sharing.expiresAt && new Date() > resume.sharing.expiresAt) {
      return res.status(404).json({ message: 'This link has expired' });
    }

    const qrcode = require('qrcode');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = \`\${frontendUrl}/shared/resume/\${linkId}?source=qr_scan\`;
    
    const qrDataUrl = await qrcode.toDataURL(shareUrl);
    res.json({ qrCode: qrDataUrl, shareUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error generating QR code', error: error.message });
  }
};

// Track Public Export
exports.trackPublicExport = async (req, res) => {
  try {
    const { linkId } = req.params;
    const resume = await Resume.findOne({ 'sharing.linkId': linkId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    resume.analytics = resume.analytics || {};
    resume.analytics.exportCount = (resume.analytics.exportCount || 0) + 1;
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();

    res.json({ message: 'Export tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error tracking export', error: error.message });
  }
};

// Track Export
exports.trackExport = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    resume.analytics = resume.analytics || {};
    resume.analytics.exportCount = (resume.analytics.exportCount || 0) + 1;
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();

    res.json({ message: 'Export tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error tracking export', error: error.message });
  }
};


const fs = require('fs');
const pdfParse = require('pdf-parse');

// Import from File (PDF or Text)
exports.importFromFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    let rawText = '';
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      rawText = data.text;
    } else {
      rawText = fs.readFileSync(req.file.path, 'utf8');
    }
    
    // Parse with Gemini
    const structuredData = await geminiService.parseResumeData(rawText, req.user.id);
    
    // Cleanup file
    fs.unlinkSync(req.file.path);
    
    res.json({ resumeData: structuredData });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Error parsing file', error: error.message });
  }
};




// Career Insights Endpoint
exports.getInsights = async (req, res) => {
  try {
    const resumes = await Resume.find({ user_id: req.user.id });
    if (resumes.length === 0) return res.status(404).json({ message: 'No resumes found' });

    // 1. Gather all unique skills
    let userSkills = new Set();
    resumes.forEach(r => {
      (r.skills || []).forEach(group => {
        (group.items || []).forEach(skill => userSkills.add(skill.toLowerCase()));
      });
    });

    // 2. Gather skills from Jobs the user applied to
    // Use the correct reference field for Job on JobApplication, which is 'job'
    const applications = await JobApplication.find({ applicant: req.user.id }).populate('job').populate('resumeId');
    let requiredSkills = {};
    
    // Tailoring effectiveness tracking
    let tailoredAppsCount = 0;
    let tailoredAppsInterviewCount = 0;
    let untailoredAppsCount = 0;
    let untailoredAppsInterviewCount = 0;

    applications.forEach(app => {
      if (app.job && app.job.skills) {
        app.job.skills.forEach(skill => {
          const s = skill.toLowerCase();
          requiredSkills[s] = (requiredSkills[s] || 0) + 1;
        });
      }
      
      // Track tailoring effectiveness
      const isInterviewed = ['shortlisted', 'interview', 'offered', 'hired'].includes(app.status);
      const isTailored = app.resumeId && app.resumeId.tailoredForJobId && app.resumeId.tailoredForJobId.toString() === app.job._id.toString();
      
      if (isTailored) {
        tailoredAppsCount++;
        if (isInterviewed) tailoredAppsInterviewCount++;
      } else {
        untailoredAppsCount++;
        if (isInterviewed) untailoredAppsInterviewCount++;
      }
    });

    // 3. Find Gaps (skills required by applied jobs but missing in user's resumes)
    let gaps = [];
    for (const [skill, count] of Object.entries(requiredSkills)) {
      if (!userSkills.has(skill)) {
        gaps.push({ skill, demand: count });
      }
    }
    gaps.sort((a, b) => b.demand - a.demand);

    // 4. ATS Trend
    const atsTrend = resumes
      .filter(r => r.atsScore && r.atsScore.score > 0)
      .map(r => ({ date: r.atsScore.lastCalculatedAt || r.updated_at, score: r.atsScore.score }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 5. Ask Gemini for next steps
    const nextSteps = await geminiService.generateCareerNextSteps(gaps.slice(0, 5).map(g => g.skill), req.user.id);
    
    
    // 6. Interview Readiness (Phase 7)
    const interviewSessions = await InterviewSession.find({ userId: req.user.id, status: 'completed' });
    let interviewReadiness = { sessionsCompleted: interviewSessions.length, commonImprovementAreas: [] };
    
    if (interviewSessions.length > 0) {
      let areaFreq = {};
      interviewSessions.forEach(session => {
        session.questions.forEach(q => {
          if (q.aiEvaluation && q.aiEvaluation.improvementAreas) {
            q.aiEvaluation.improvementAreas.forEach(area => {
              // Simple normalization for grouping similar areas (very basic)
              const key = area.toLowerCase().substring(0, 30);
              areaFreq[area] = (areaFreq[area] || 0) + 1;
            });
          }
        });
      });
      // Sort and take top 3
      interviewReadiness.commonImprovementAreas = Object.entries(areaFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
    }

    const tailoringEffectiveness = {
      tailored: {
        total: tailoredAppsCount,
        interviewed: tailoredAppsInterviewCount,
        rate: tailoredAppsCount > 0 ? (tailoredAppsInterviewCount / tailoredAppsCount) * 100 : 0
      },
      untailored: {
        total: untailoredAppsCount,
        interviewed: untailoredAppsInterviewCount,
        rate: untailoredAppsCount > 0 ? (untailoredAppsInterviewCount / untailoredAppsCount) * 100 : 0
      }
    };

    res.json({
      skillGaps: gaps,
      atsTrend,
      nextSteps,
      interviewReadiness,
      tailoringEffectiveness
    });
  } catch (error) {
    logger.error('Insights Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  // Export formats
exports.exportFormat = async (req, res) => {
  try {
    const { id, format } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    resume.analytics = resume.analytics || {};
    resume.analytics.exportCount = (resume.analytics.exportCount || 0) + 1;
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();

    if (format === 'json') {
      return res.json(resume);
    } else if (format === 'txt') {
      // Build plain text
      let txt = `${resume.personalInfo?.fullName || 'Resume'}\n`;
      txt += `${resume.personalInfo?.email || ''} | ${resume.personalInfo?.phone || ''}\n\n`;
      if (resume.personalInfo?.professionalSummary) {
        txt += `SUMMARY\n${resume.personalInfo.professionalSummary}\n\n`;
      }
      if (resume.experience && resume.experience.length > 0) {
        txt += `EXPERIENCE\n`;
        resume.experience.forEach(exp => {
          txt += `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
          (exp.bulletPoints || []).forEach(bp => txt += `* ${bp}\n`);
        });
        txt += `\n`;
      }
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.title}.txt"`);
      return res.send(txt);
    } else if (format === 'docx') {
      // Basic mock DOCX for now (proper requires docx library, but requirements say generated from structured data)
      // Since it's a backend endpoint, we return JSON containing raw text, frontend will handle Blob download
      return res.json({ format: 'docx', rawData: resume });
    } else {
      return res.status(400).json({ message: 'Unsupported format' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// LinkedIn Export (Phase 7)
exports.exportLinkedIn = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const resumeContext = JSON.stringify({
      experience: resume.experience,
      projects: resume.projects,
      skills: resume.skills
    });
    
    const linkedinData = await geminiService.exportLinkedInSummary(resumeContext);
    res.json(linkedinData);
  } catch (error) {
    logger.error('LinkedIn Export Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Phase 8: Gamification / Completeness
exports.getCompleteness = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    let score = 0;
    const maxScore = 100;
    let missing = [];

    // Basic fields
    if (resume.personalInfo) {
      if (resume.personalInfo.name) score += 10; else missing.push('Name');
      if (resume.personalInfo.email) score += 10; else missing.push('Email');
      if (resume.personalInfo.phone) score += 5;
    } else {
      missing.push('Personal Info');
    }

    if (resume.summary) score += 15; else missing.push('Summary');

    if (resume.experience && resume.experience.length > 0) {
      score += 20;
      // Bonus for bullets
      let hasBullets = false;
      let hasMetrics = false;
      resume.experience.forEach(exp => {
        if (exp.description && exp.description.length > 10) hasBullets = true;
        if (/\d+%|\$\d+|\d+x/i.test(exp.description)) hasMetrics = true;
      });
      if (hasBullets) score += 10; else missing.push('Experience Descriptions');
      if (hasMetrics) score += 10; else missing.push('Quantified Metrics in Experience');
    } else {
      missing.push('Work Experience');
    }

    if (resume.education && resume.education.length > 0) score += 10; else missing.push('Education');
    if (resume.skills && resume.skills.length > 0) score += 10; else missing.push('Skills');

    score = Math.min(score, maxScore);

    res.json({ score, missing, badges: resume.gamificationBadges });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Phase 8: Translation
exports.translateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLanguage } = req.body;
    
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const resumeDataToTranslate = {
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      projects: resume.projects,
      skills: resume.skills
    };

    const translatedData = await geminiService.translateResume(resumeDataToTranslate, targetLanguage);

    const translatedResume = new Resume({
      user_id: req.user.id,
      title: `${resume.title} (${targetLanguage})`,
      personalInfo: resume.personalInfo,
      ...translatedData,
      language: targetLanguage,
      translatedFrom: resume._id,
      translationStatus: 'ai_translated',
      gamificationBadges: resume.gamificationBadges
    });

    await translatedResume.save();
    res.status(201).json(translatedResume);
  } catch (error) {
    console.error('Translation Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Phase 8: Employer Discovery Feed
exports.getDiscoveryFeed = async (req, res) => {
  try {
    // Only recruiters should access this
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for discovery feed' });
    }

    // Find users who opted in to candidate search
    const users = await User.find({ 'careerVisibility.visibleToRecruiters': true }).select('_id');
    const userIds = users.map(u => u._id);

    // Find their best resume (either explicitly marked, or we just grab one per user)
    // For simplicity, we grab isDiscoveryResume = true OR isDefault = true
    const resumes = await Resume.find({
      user_id: { $in: userIds },
      $or: [{ isDiscoveryResume: true }, { isDefault: true }]
    })
    .populate('user_id', 'name email profilePicture')
    .sort('-updatedAt')
    .limit(50);

    // Filter to one per user
    const uniqueResumes = [];
    const seenUsers = new Set();
    for (const r of resumes) {
      if (!seenUsers.has(r.user_id._id.toString())) {
        uniqueResumes.push(r);
        seenUsers.add(r.user_id._id.toString());
      }
    }

    res.json(uniqueResumes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.trackDiscoveryView = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await Resume.findByIdAndUpdate(id, { $inc: { discoveryViews: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Phase 8: Health Nudges
exports.triggerHealthNudges = async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const staleResumes = await Resume.find({ updatedAt: { $lt: twoWeeksAgo } });
    const notifiedUsers = new Set();
    let count = 0;

    for (const resume of staleResumes) {
      if (!notifiedUsers.has(resume.user_id.toString())) {
        const notif = new Notification({
          user: resume.user_id,
          type: 'system_alert',
          title: 'Resume Health Check',
          message: `Your resume "${resume.title}" hasn't been updated in over 2 weeks. Keeping it fresh helps you stand out!`,
          link: `/resume/builder/${resume._id}`
        });
        await notif.save();
        notifiedUsers.add(resume.user_id.toString());
        count++;
      }
    }
    res.json({ message: `Triggered ${count} health nudges.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Phase 9: AI Chat Editing
exports.proposeResumeEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const { instruction } = req.body;
    
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const resumeContext = {
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
      services: resume.services
    };

    const diff = await geminiService.proposeResumeEdit(resumeContext, instruction);
    res.json({ diff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.archiveResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    resume.isArchived = true;
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unarchiveResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    resume.isArchived = false;
    
    // Phase 10: Check for 48-hr workshop edit
    if (resume.attendedWorkshopAt) {
      const msDiff = new Date() - new Date(resume.attendedWorkshopAt);
      if (msDiff < 48 * 60 * 60 * 1000) {
        resume.versionHistory.push({
          version_name: 'Edited following Workshop',
          snapshot: JSON.parse(JSON.stringify(resume.toObject())),
          created_at: new Date()
        });
        resume.attendedWorkshopAt = null; // Clear it so it doesn't trigger repeatedly
      }
    }

    await resume.save();
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getIndustryBenchmark = async (req, res) => {
  try {
    const { role } = req.query; // target role
    // Return an aggregate score for non-archived resumes. In a real scenario, this would group by role/title
    // We'll mock a realistic average response for demonstration since exact role-matching needs deep ML or text search
    
    // Check if enough data exists
    const count = await Resume.countDocuments({ isArchived: { $ne: true }, 'atsScore.score': { $gt: 0 } });
    if (count < 5) {
      return res.json({ available: false, message: 'Insufficient aggregate data for this role.' });
    }
    
    res.json({
      available: true,
      averageScore: 78,
      categoryAverages: {
        impact: 72,
        brevity: 81,
        skillsMatch: 75,
        formatting: 85
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.generateNarrative = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const narrative = await geminiService.generateNarrative({
      title: resume.title,
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      projects: resume.projects,
      skills: resume.skills
    }, req.user.id);

    resume.narrativeDraft = narrative;
    await resume.save();

    res.json({ narrativeDraft: narrative });
  } catch (error) {
    console.error('Error generating narrative:', error);
    res.status(500).json({ message: 'Failed to generate narrative' });
  }
};

exports.updateBackupSettings = async (req, res) => {
  try {
    const { interval } = req.body;
    if (!['none', 'monthly', 'quarterly'].includes(interval)) {
      return res.status(400).json({ message: 'Invalid interval' });
    }
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.resumeBackupSettings = user.resumeBackupSettings || {};
    user.resumeBackupSettings.interval = interval;
    await user.save();

    res.json({ message: 'Backup settings updated', settings: user.resumeBackupSettings });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating backup settings', error: error.message });
  }
};

exports.downloadFullBackup = async (req, res) => {
  try {
    const User = require('../models/User');
    const CoverLetter = require('../models/CoverLetter');
    const PortfolioPage = require('../models/PortfolioPage');
    
    const [resumes, coverLetters, portfolios, user] = await Promise.all([
      Resume.find({ user_id: req.user.id }),
      CoverLetter.find({ user_id: req.user.id }),
      PortfolioPage.find({ user_id: req.user.id }),
      User.findById(req.user.id)
    ]);

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`StudentHub_Backup_${user.username || 'user'}_${new Date().toISOString().split('T')[0]}.zip`);
    archive.pipe(res);

    archive.append(JSON.stringify(resumes, null, 2), { name: 'resumes.json' });
    archive.append(JSON.stringify(coverLetters, null, 2), { name: 'cover_letters.json' });
    archive.append(JSON.stringify(portfolios, null, 2), { name: 'portfolios.json' });

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ message: 'Server error generating backup', error: error.message });
  }
};

exports.exportAnonymousVariant = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const { fieldsToStrip = [] } = req.body;
    // deep clone
    const anonymized = JSON.parse(JSON.stringify(resume.toObject()));
    
    // Always replace name if asked, or ID as standard
    if (fieldsToStrip.includes('name')) {
      anonymized.personalInfo.fullName = `Candidate #${anonymized._id.toString().substring(18)}`;
    }
    if (fieldsToStrip.includes('photo')) {
      anonymized.personalInfo.avatarUrl = null;
    }
    if (fieldsToStrip.includes('email')) {
      anonymized.personalInfo.email = 'candidate@redacted.com';
    }
    if (fieldsToStrip.includes('phone')) {
      anonymized.personalInfo.phone = 'redacted';
    }
    if (fieldsToStrip.includes('links')) {
      anonymized.links = [];
    }

    if (fieldsToStrip.includes('institution') && anonymized.education) {
      anonymized.education = anonymized.education.map(edu => {
        edu.institution = 'Redacted Institution';
        return edu;
      });
    }
    if (fieldsToStrip.includes('graduationYear') && anonymized.education) {
      anonymized.education = anonymized.education.map(edu => {
        edu.startDate = null;
        edu.endDate = null;
        return edu;
      });
    }

    res.json({ anonymizedVariant: anonymized });
  } catch (error) {
    res.status(500).json({ message: 'Server error generating anonymous variant', error: error.message });
  }
};
