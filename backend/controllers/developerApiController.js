const DeveloperToken = require('../models/DeveloperToken');
const Resume = require('../models/Resume');
const crypto = require('crypto');

exports.generateToken = async (req, res) => {
  try {
    const { resumeId, name } = req.body;
    
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const tokenString = 'sk_res_' + crypto.randomBytes(24).toString('hex');
    
    const token = new DeveloperToken({
      userId: req.user.id,
      resumeId,
      tokenHash: tokenString,
      name
    });

    await token.save();
    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyTokens = async (req, res) => {
  try {
    const tokens = await DeveloperToken.find({ userId: req.user.id }).populate('resumeId', 'title');
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.revokeToken = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await DeveloperToken.findById(id);
    if (!token) return res.status(404).json({ message: 'Not found' });
    if (token.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    token.revoked = true;
    await token.save();
    res.json({ message: 'Token revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUBLIC API endpoint accessed by 3rd parties using the token
exports.getResumeData = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing Bearer token' });
    }
    
    const tokenString = authHeader.split(' ')[1];
    const devToken = await DeveloperToken.findOne({ tokenHash: tokenString });
    
    if (!devToken || devToken.revoked) {
      return res.status(401).json({ message: 'Invalid or revoked token' });
    }

    const resume = await Resume.findById(devToken.resumeId);
    if (!resume || resume.isArchived) {
      return res.status(404).json({ message: 'Resume not found or archived' });
    }

    // Increment usage
    devToken.usageCount += 1;
    devToken.lastUsedAt = new Date();
    await devToken.save();

    // Return structured JSON
    res.json({
      title: resume.title,
      summary: resume.summary,
      skills: resume.skills,
      experience: resume.experience,
      education: resume.education,
      projects: resume.projects,
      certifications: resume.certifications,
      portfolioLinks: resume.portfolioLinks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
