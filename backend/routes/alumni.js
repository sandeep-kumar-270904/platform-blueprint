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
      willingness, availabilityNote,
      skills, about, areasOfExpertise, careerHistory
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
      skills: skills || [],
      about,
      areasOfExpertise: areasOfExpertise || [],
      careerHistory: careerHistory || []
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

// GET /api/alumni/directory - Phase 8: Directory Discovery
router.get('/directory', auth, async (req, res) => {
  try {
    const { company, year, role, skills, willingToMentor, pastCompany } = req.query;
    
    // Default filter for visibility
    const filter = { visibility: { $in: ['public', 'students-only'] } }; 
    
    if (company) {
      filter.currentCompany = { $regex: new RegExp(company, 'i') };
    }
    if (pastCompany) {
      filter['careerHistory.company'] = { $regex: new RegExp(pastCompany, 'i') };
    }
    if (year) {
      filter.graduationYear = Number(year);
    }
    if (role) {
      filter.currentRole = { $regex: new RegExp(role, 'i') };
    }
    if (skills) {
      const skillsArray = skills.split(',').map(s => new RegExp(s.trim(), 'i'));
      filter.skills = { $in: skillsArray };
    }
    if (willingToMentor === 'true') {
      filter['willingness.openToMentoring'] = true;
    }
    
    const alumni = await AlumniProfile.find(filter)
      .populate('userId', 'full_name avatar_url bio')
      .populate('collegeId', 'name')
      .sort({ createdAt: -1 })
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

// GET /api/alumni/profile/:id - Get a specific alumni profile by ID
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const profile = await AlumniProfile.findById(req.params.id)
      .populate('userId', 'full_name avatar_url bio email')
      .populate('collegeId', 'name');
      
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Hide email unless they are connected (to be enforced later, for now we just return basic fields)
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// GET /api/alumni/claim/:token - Validate token and get registry details
router.get('/claim/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const registry = await require('../models/AlumniRegistry').findOne({
      claimToken: token,
      claimTokenExpiresAt: { $gt: new Date() },
      status: { $in: ['UNCLAIMED', 'CLAIM_PENDING'] } // in case they somehow retry
    }).populate('collegeId', 'name');

    if (!registry) {
      return res.status(400).json({ message: 'Token is invalid, expired, or already claimed.' });
    }

    // Only return safe fields
    res.json({
      collegeName: registry.collegeId.name,
      collegeId: registry.collegeId._id,
      graduationYear: registry.graduationYear,
      degree: registry.degree,
      branch: registry.branch
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/alumni/claim - Atomically claim the registry record
router.post('/claim', auth, async (req, res) => {
  try {
    const { token, currentRole, currentCompany, about, skills } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const AlumniRegistry = require('../models/AlumniRegistry');

    // Atomic findAndModify to prevent race conditions
    const registry = await AlumniRegistry.findOneAndUpdate(
      { 
        claimToken: token, 
        claimTokenExpiresAt: { $gt: new Date() },
        status: 'UNCLAIMED' 
      },
      { 
        $set: { 
          status: 'VERIFIED',
          claimedBy: req.user.id,
          claimedAt: new Date(),
          claimToken: null, // Nullify token so it can't be used again
          claimTokenExpiresAt: null
        }
      },
      { new: true }
    );

    if (!registry) {
      return res.status(400).json({ message: 'Claim failed. Token may be invalid, expired, or already claimed by someone else.' });
    }

    const user = await User.findById(req.user.id);
    
    // Auto-fill user fields if empty
    if (!user.graduation_year || !user.university) {
      user.graduation_year = registry.graduationYear;
      user.degree = registry.branch; // mapping branch to degree field in User
      await user.save();
    }

    // Create or update AlumniProfile
    let profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (profile) {
      profile.collegeId = registry.collegeId;
      profile.branch = registry.branch;
      profile.graduationYear = registry.graduationYear;
      profile.verificationStatus = 'verified';
      profile.verificationMethod = 'institutional-token';
      profile.registryId = registry._id;
      if (currentRole) profile.currentRole = currentRole;
      if (currentCompany) profile.currentCompany = currentCompany;
      if (about) profile.about = about;
      if (skills) profile.skills = skills;
      await profile.save();
    } else {
      profile = await AlumniProfile.create({
        userId: req.user.id,
        collegeId: registry.collegeId,
        branch: registry.branch,
        graduationYear: registry.graduationYear,
        currentRole,
        currentCompany,
        about,
        skills,
        verificationStatus: 'verified',
        verificationMethod: 'institutional-token',
        registryId: registry._id,
        visibility: 'students-only'
      });
    }

    res.json({ message: 'Successfully claimed alumni identity', profile });
  } catch (error) {
    res.status(500).json({ message: 'Error claiming profile', error: error.message });
  }
});

module.exports = router;
