const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

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

// POST /api/resumes/ats-check
router.post('/ats-check', authMiddleware, async (req, res) => {
  try {
    const { resumeUrl, resumeText, targetJobId } = req.body;

    let textToAnalyze = resumeText || '';

    // If a resume URL is provided, try to extract text if it's a PDF
    if (resumeUrl && !textToAnalyze) {
      // In this system, uploads are stored locally in the /uploads folder
      // resumeUrl might look like "/uploads/12345-resume.pdf"
      // Wait, we need to locate the file safely.
      const filename = resumeUrl.split('/').pop();
      const filePath = path.join(__dirname, '..', 'uploads', filename);

      if (fs.existsSync(filePath)) {
        if (filename.toLowerCase().endsWith('.pdf')) {
          try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            textToAnalyze = data.text;
          } catch (pdfErr) {
            console.error('PDF Parse error:', pdfErr);
            textToAnalyze = '';
          }
        }
      }
    }

    if (!textToAnalyze) {
      return res.status(400).json({ message: 'No resume text provided or could not extract text from file.' });
    }

    const textLower = textToAnalyze.toLowerCase();

    // 1. Formatting Checks
    const formattingChecks = [];
    
    // Length check
    if (textToAnalyze.length < 500) {
      formattingChecks.push({ check: 'Length', passed: false, detail: 'Resume appears too short (under 500 characters).' });
    } else if (textToAnalyze.length > 15000) {
      formattingChecks.push({ check: 'Length', passed: false, detail: 'Resume appears too long, possibly multiple pages of dense text.' });
    } else {
      formattingChecks.push({ check: 'Length', passed: true, detail: 'Resume length is optimal.' });
    }

    // Email check
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(textToAnalyze);
    formattingChecks.push({ check: 'Email', passed: hasEmail, detail: hasEmail ? 'Email found.' : 'Missing email address.' });

    // Phone check (basic 10 digit)
    const hasPhone = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?/.test(textToAnalyze);
    formattingChecks.push({ check: 'Phone', passed: hasPhone, detail: hasPhone ? 'Phone number found.' : 'Missing phone number.' });

    // Section headers check
    const hasExperience = /\b(experience|employment|work history)\b/.test(textLower);
    formattingChecks.push({ check: 'Experience Section', passed: hasExperience, detail: hasExperience ? 'Experience section found.' : 'Could not detect an Experience section.' });

    const hasEducation = /\b(education|academic|degree)\b/.test(textLower);
    formattingChecks.push({ check: 'Education Section', passed: hasEducation, detail: hasEducation ? 'Education section found.' : 'Could not detect an Education section.' });

    // 2. Keyword Checks against target Job
    const matchedKeywords = [];
    const missingKeywords = [];
    let matchPercentage = 0;

    if (targetJobId) {
      const job = await Job.findById(targetJobId);
      if (job && job.skills && job.skills.length > 0) {
        job.skills.forEach(skill => {
          // Escape special characters in skill for regex
          const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          // Word boundary match
          const skillRegex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
          
          if (skillRegex.test(textToAnalyze) || textLower.includes(skill.toLowerCase())) {
            matchedKeywords.push(skill);
          } else {
            missingKeywords.push(skill);
          }
        });

        matchPercentage = Math.round((matchedKeywords.length / job.skills.length) * 100);
      }
    }

    res.json({
      formattingChecks,
      matchedKeywords,
      missingKeywords,
      matchPercentage,
      parsedTextPreview: textToAnalyze.substring(0, 500) + (textToAnalyze.length > 500 ? '...' : '')
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
