const Resume = require('../models/Resume');
const ResumeVersion = require('../models/ResumeVersion');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

// Get all resumes for user
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user_id: req.user.id }).sort({ updated_at: -1 });
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

    const atsResult = await geminiService.scoreResume(resume);
    
    resume.atsScore = {
      score: atsResult.score,
      breakdown: atsResult.breakdown,
      tips: atsResult.tips,
      lastCalculatedAt: new Date()
    };
    
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

// Track Public Export
exports.trackPublicExport = async (req, res) => {
  try {
    const { linkId } = req.params;
    const resume = await Resume.findOne({ 'sharing.linkId': linkId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    resume.analytics = resume.analytics || {};
    resume.analytics.exportCount = (resume.analytics.exportCount || 0) + 1;
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
    await resume.save();

    res.json({ message: 'Export tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error tracking export', error: error.message });
  }
};

