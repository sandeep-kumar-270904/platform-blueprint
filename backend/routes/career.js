const express = require('express');
const router = express.Router();
const CareerRole = require('../models/CareerRole');
const User = require('../models/User');
const Job = require('../models/Job');
const AlumniProfile = require('../models/AlumniProfile');
const authMiddleware = require('../middleware/auth');

// GET /api/career/roles - Get all available career roles for goal setting
router.get('/roles', authMiddleware, async (req, res) => {
  try {
    const roles = await CareerRole.find({ isActive: true }).sort({ title: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/career/goal - Set user career goal
router.post('/goal', authMiddleware, async (req, res) => {
  try {
    const { targetRole, targetRoleId, targetSkills } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.careerGoal = {
      targetRole,
      targetRoleId,
      targetSkills: targetSkills || []
    };
    
    // If we have a targetRoleId, fetch recommended skills and merge
    if (targetRoleId) {
      const role = await CareerRole.findById(targetRoleId);
      if (role && role.recommendedSkills) {
        const combined = new Set([...user.careerGoal.targetSkills, ...role.recommendedSkills]);
        user.careerGoal.targetSkills = Array.from(combined);
      }
    }
    
    await user.save();
    res.json({ message: 'Career goal updated successfully', careerGoal: user.careerGoal });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/career/path - Get deterministic career path recommendations
router.get('/path', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('careerGoal');
    if (!user || !user.careerGoal || (!user.careerGoal.targetRole && !user.careerGoal.targetRoleId)) {
      return res.status(400).json({ message: 'No career goal set. Please set a career goal first.' });
    }
    
    const { targetRole, targetSkills } = user.careerGoal;
    
    // Find relevant opportunities (matching skills or title text)
    const opportunitiesQuery = {
      status: 'published',
      $or: [
        { applicationDeadline: { $gt: new Date() } },
        { applicationDeadline: null },
        { applicationDeadline: { $exists: false } }
      ]
    };
    
    if (targetSkills && targetSkills.length > 0) {
      opportunitiesQuery.skills = { $in: targetSkills };
    } else if (targetRole) {
      opportunitiesQuery.$text = { $search: targetRole };
    }
    
    const relevantOpportunities = await Job.find(opportunitiesQuery)
      .limit(5)
      .sort({ createdAt: -1 })
      .populate('postedBy', 'full_name avatar_url');
      
    // Find relevant alumni (matching skills or currentRole text)
    const alumniQuery = {
      verificationStatus: 'verified',
      visibility: { $in: ['public', 'students-only'] }
    };
    
    if (targetSkills && targetSkills.length > 0) {
      alumniQuery.skills = { $in: targetSkills };
    }
    // Alternatively or additionally check currentRole
    
    const relevantAlumni = await AlumniProfile.find(alumniQuery)
      .limit(5)
      .populate('userId', 'full_name avatar_url username');
      
    res.json({
      careerGoal: user.careerGoal,
      relevantOpportunities,
      relevantAlumni,
      recommendedActions: [
        { title: 'Update your resume', type: 'resume' },
        { title: 'Apply to an opportunity', type: 'apply' },
        { title: 'Connect with an alumni mentor', type: 'mentor' }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
