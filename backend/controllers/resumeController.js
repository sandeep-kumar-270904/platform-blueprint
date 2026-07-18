const Resume = require('../models/Resume');
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
    res.json(resume.atsScore);
  } catch (error) {
    logger.error('Error scoring resume:', error);
    res.status(503).json({ message: error.message || 'Scoring temporarily unavailable, try again' });
  }
};
