const express = require('express');
const router = express.Router();
const AlumniProfile = require('../models/AlumniProfile');
const User = require('../models/User');
const College = require('../models/College');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/alumni/register - Create or update alumni profile
router.post('/register', auth, async (req, res) => {
  try {
    const { 
      collegeId, branch, graduationYear, 
      currentRole, currentCompany, visibility, 
      willingness, availabilityNote 
    } = req.body;

    if (!collegeId || !branch || !graduationYear) {
      return res.status(400).json({ message: 'College, branch, and graduation year are required.' });
    }

    // Verify college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found.' });
    }

    const user = await User.findById(req.user.id);
    let verificationStatus = 'pending';
    let verificationMethod = 'manual';

    // Auto-verify if user's email matches college domain
    if (college.officialEmailDomain && user.email) {
      const userDomain = user.email.split('@')[1];
      if (userDomain === college.officialEmailDomain) {
        verificationStatus = 'verified';
        verificationMethod = 'domain-match';
      }
    }

    const updateData = {
      collegeId,
      branch,
      graduationYear,
      currentRole,
      currentCompany,
      visibility: visibility || 'students-only',
      willingness,
      availabilityNote,
      // If they were already verified, changing these shouldn't automatically unverify them in this basic logic,
      // but if we are creating new or they were unverified/rejected, set the new status.
    };

    let profile = await AlumniProfile.findOne({ userId: req.user.id });

    if (profile) {
      // Update existing
      // Only update verification status if it's not already verified
      if (profile.verificationStatus !== 'verified') {
        updateData.verificationStatus = verificationStatus;
        updateData.verificationMethod = verificationMethod;
      }
      profile = await AlumniProfile.findByIdAndUpdate(profile._id, updateData, { new: true });
    } else {
      // Create new
      updateData.userId = req.user.id;
      updateData.verificationStatus = verificationStatus;
      updateData.verificationMethod = verificationMethod;
      profile = new AlumniProfile(updateData);
      await profile.save();
    }

    // Also update the User model for convenience if not already set
    if (!user.graduation_year || !user.university) {
      user.graduation_year = graduationYear;
      user.university = college.name;
      user.degree = branch;
      await user.save();
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error registering alumni profile', error: error.message });
  }
});

// GET /api/alumni/me - Get current user's alumni profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await AlumniProfile.findOne({ userId: req.user.id }).populate('collegeId', 'name');
    if (!profile) return res.status(404).json({ message: 'Alumni profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// GET /api/alumni/directory - Global Alumni Directory
router.get('/directory', auth, async (req, res) => {
  try {
    const { company, year } = req.query;
    const filter = { visibility: { $ne: 'hidden' } }; // Basic filter
    
    if (company) {
      filter.currentCompany = { $regex: new RegExp(company, 'i') };
    }
    if (year) {
      filter.graduationYear = Number(year);
    }
    
    const alumni = await AlumniProfile.find(filter)
      .populate('userId', 'full_name avatar_url')
      .populate('collegeId', 'name')
      .limit(50);
      
    res.json({ alumni });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching directory', error: error.message });
  }
});

// GET /api/alumni/colleges/:id - Get alumni directory for a college
router.get('/colleges/:id', async (req, res) => {
  try {
    const { branch, gradYear, willingToMentor, willingForQa, page = 1, limit = 12 } = req.query;
    
    // Default to only showing verified, public/students-only (assuming auth checked on frontend)
    // For now, let's just return verified ones that are not private.
    // If the request doesn't have a valid token (not logged in), only show 'public'
    // This route isn't strictly authenticated by middleware, so we check token manually if we want 'students-only'
    
    let isStudentOrAlumni = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Very basic check - if they have a token they are a registered user ("student")
      isStudentOrAlumni = true;
    }

    const visibilityCondition = isStudentOrAlumni ? { $in: ['public', 'students-only'] } : 'public';

    let query = {
      collegeId: req.params.id,
      verificationStatus: 'verified',
      visibility: visibilityCondition
    };

    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (gradYear) query.graduationYear = parseInt(gradYear);
    if (willingToMentor === 'true') query['willingness.openToMentoring'] = true;
    if (willingForQa === 'true') query['willingness.openToQa'] = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const alumniProfiles = await AlumniProfile.find(query)
      .populate('userId', 'full_name avatar_url bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AlumniProfile.countDocuments(query);

    res.json({
      alumni: alumniProfiles,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumni', error: error.message });
  }
});

// GET /api/alumni/admin/queue - Get pending verifications
router.get('/admin/queue', auth, isAdmin, async (req, res) => {
  try {
    const queue = await AlumniProfile.find({ verificationStatus: 'pending' })
      .populate('userId', 'full_name email')
      .populate('collegeId', 'name')
      .sort({ createdAt: 1 });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification queue', error: error.message });
  }
});

// PUT /api/alumni/admin/:id/verify - Approve/Reject
router.put('/admin/:id/verify', auth, isAdmin, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const profile = await AlumniProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.verificationStatus = status;
    profile.verificationMethod = 'manual';
    if (status === 'rejected') {
      profile.rejectionReason = rejectionReason;
    }

    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error updating verification status', error: error.message });
  }
});

module.exports = router;
