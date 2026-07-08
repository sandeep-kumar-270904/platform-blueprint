const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const authMiddleware = require('../middleware/auth');

// Simple mock logic for ATS score
const calculateAtsScore = (resume) => {
  let score = 50;
  const tips = [];
  
  if (resume.summary && resume.summary.length > 50) {
    score += 15;
  } else {
    tips.push({ issue: "Short Summary", severity: "medium", tip: "Expand your professional summary to include key skills." });
  }
  
  if (resume.phone && resume.email) {
    score += 15;
  } else {
    tips.push({ issue: "Missing Contact Info", severity: "high", tip: "Ensure both phone and email are provided." });
  }
  
  if (resume.summary && /\d/.test(resume.summary)) { // Has numbers/metrics
    score += 20;
  } else {
    tips.push({ issue: "No Quantifiable Metrics", severity: "high", tip: "Include numbers or percentages in your summary/experience." });
  }
  
  return { score: Math.min(score, 100), tips };
};

// GET /api/resumes/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let resume = await Resume.findOne({ user_id: req.user.id });
    
    if (!resume) {
      // Create empty default
      resume = new Resume({ user_id: req.user.id });
      await resume.save();
    }
    
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/resumes/me
router.post('/me', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, summary } = req.body;
    
    let resume = await Resume.findOne({ user_id: req.user.id });
    if (!resume) {
      resume = new Resume({ user_id: req.user.id });
    }
    
    resume.name = name || resume.name;
    resume.email = email || resume.email;
    resume.phone = phone || resume.phone;
    resume.summary = summary || resume.summary;
    
    const { score, tips } = calculateAtsScore(resume);
    resume.ats_score = score;
    resume.ats_tips = tips;
    
    await resume.save();
    
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
