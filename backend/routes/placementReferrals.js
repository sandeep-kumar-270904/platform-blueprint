const express = require('express');
const router = express.Router();
const ReferrerProfile = require('../models/ReferrerProfile');
const ReferralRequest = require('../models/ReferralRequest');
const ResumeVersion = require('../models/ResumeVersion');
const ReferralFeedback = require('../models/ReferralFeedback');
const ReferrerReport = require('../models/ReferrerReport');
const notificationService = require('../services/notificationService');
const { syncItem, removeItem } = require('../services/placementSearchService');
const authMiddleware = require('../middleware/auth');

// Get active referrers for a company
router.get('/company/:companyId', authMiddleware, async (req, res) => {
  try {
    const profiles = await ReferrerProfile.find({ 
      company: req.params.companyId, 
      is_active: true,
      isUnderReview: { $ne: true }
    }).populate('user', 'name avatar email avatarUrl').lean();
    
    // Calculate if they are at capacity
    const profilesWithCapacity = await Promise.all(profiles.map(async (profile) => {
      const activeRequests = await ReferralRequest.countDocuments({
        referrer_profile: profile._id,
        status: { $in: ['pending', 'accepted'] }
      });
      return {
        ...profile,
        activeRequests,
        atCapacity: profile.limit && activeRequests >= profile.limit
      };
    }));
    
    res.json(profilesWithCapacity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or Update Referrer Profile (Opt-in)
router.post('/opt-in', authMiddleware, async (req, res) => {
  try {
    const { company, role, batch_year, note, limit, is_active, workEmail, linkedInUrl } = req.body;
    
    let profile = await ReferrerProfile.findOne({ user: req.user.id, company });
    
    let becomingInactive = false;

    // Mock OTP Generation for Trust Layer
    const mockOtp = "123456";
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15); // Valid for 15 mins

    if (profile) {
      if (is_active === false && profile.is_active === true) {
        becomingInactive = true;
      }
      
      profile.role = role || profile.role;
      profile.batch_year = batch_year || profile.batch_year;
      profile.note = note !== undefined ? note : profile.note;
      profile.limit = limit || profile.limit;
      profile.is_active = is_active !== undefined ? is_active : profile.is_active;
      
      if (workEmail) {
        profile.verifiedEmail = workEmail;
        profile.verificationStatus = 'Pending';
        profile.verificationCode = mockOtp;
        profile.verificationCodeExpires = otpExpiry;
      }
      if (linkedInUrl !== undefined) {
        profile.linkedInUrl = linkedInUrl;
      }
      
      await profile.save();
    } else {
      profile = new ReferrerProfile({
        user: req.user.id,
        company,
        role,
        batch_year,
        note,
        limit,
        is_active: is_active !== undefined ? is_active : true,
        verifiedEmail: workEmail,
        verificationStatus: workEmail ? 'Pending' : 'Unverified',
        verificationCode: workEmail ? mockOtp : undefined,
        verificationCodeExpires: workEmail ? otpExpiry : undefined,
        linkedInUrl
      });
      await profile.save();
    }
    
    // If opting out, mark pending/accepted requests as unavailable
    if (becomingInactive) {
      await ReferralRequest.updateMany(
        { referrer_profile: profile._id, status: { $in: ['pending', 'accepted'] } },
        { $set: { status: 'unavailable', response_message: 'Referrer is no longer available.' } }
      );
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's referrer profiles
router.get('/my-profile', authMiddleware, async (req, res) => {
  try {
    const profiles = await ReferrerProfile.find({ user: req.user.id }).populate('company', 'name logoUrl');
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit a referral request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { referrer_profile, company, resume, target_role, message } = req.body;
    
    const profile = await ReferrerProfile.findById(referrer_profile).populate('user', 'name');
    if (!profile) return res.status(404).json({ message: 'Referrer profile not found' });
    
    if (!profile.is_active) {
      return res.status(400).json({ message: 'Referrer is currently not accepting requests' });
    }

    // Check if student already has a pending/accepted request for this profile
    const existingRequest = await ReferralRequest.findOne({
      requester: req.user.id,
      referrer_profile,
      company,
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have an active request with this referrer.' });
    }

    // Check limit
    const activeRequests = await ReferralRequest.countDocuments({ 
      referrer_profile, 
      status: { $in: ['pending', 'accepted'] } 
    });
    
    if (profile.limit && activeRequests >= profile.limit) {
      return res.status(400).json({ message: 'Referrer has reached their limit for active requests.' });
    }
    
    // Snapshot resume
    const resumeDoc = await ResumeVersion.findById(resume);
    if (!resumeDoc) return res.status(404).json({ message: 'Selected resume not found' });

    const request = new ReferralRequest({
      requester: req.user.id,
      referrer_profile,
      company,
      resumeSnapshot: {
        original_id: resumeDoc._id,
        file_url: resumeDoc.file_url,
        versionName: resumeDoc.versionName
      },
      target_role,
      message,
      status: 'pending' // statusHistory is handled by pre-save hook
    });
    
    await request.save();
    
    // Notify referrer
    if (notificationService && notificationService.createNotification) {
      await notificationService.createNotification({
        userId: profile.user._id,
        type: 'referral_request_received',
        message: `New referral request for ${target_role}`,
        relatedContentId: request._id
      });
    }

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get requests sent by user
router.get('/requests/sent', authMiddleware, async (req, res) => {
  try {
    const requests = await ReferralRequest.find({ requester: req.user.id })
      .populate('company', 'name logoUrl')
      .populate({
        path: 'referrer_profile',
        populate: { path: 'user', select: 'name avatar avatarUrl' }
      })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get requests received by user's referrer profile
router.get('/requests/received', authMiddleware, async (req, res) => {
  try {
    const profiles = await ReferrerProfile.find({ user: req.user.id });
    const profileIds = profiles.map(p => p._id);
    
    const requests = await ReferralRequest.find({ referrer_profile: { $in: profileIds } })
      .populate('requester', 'name avatar email avatarUrl')
      .populate('company', 'name logoUrl')
      .sort({ createdAt: -1 });
      
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status
router.put('/requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, response_message } = req.body;
    const request = await ReferralRequest.findById(req.params.id).populate('referrer_profile');
    
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    if (request.referrer_profile.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Validate Status Transitions
    const currentStatus = request.status;
    const validTransitions = {
      'pending': ['accepted', 'declined'],
      'accepted': ['referred', 'declined'],
      'declined': [],
      'referred': [],
      'unavailable': []
    };
    
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ message: `Invalid status transition from ${currentStatus} to ${status}` });
    }
    
    request.status = status;
    if (response_message !== undefined) {
      request.response_message = response_message;
    }
    
    await request.save(); // pre-save hook records history

    // If marked referred, increment ReferrerProfile count
    if (status === 'referred') {
      await ReferrerProfile.findByIdAndUpdate(request.referrer_profile._id, {
        $inc: { total_referrals_given: 1 }
      });
    }

    // Notify requester
    if (notificationService && notificationService.createNotification) {
      await notificationService.createNotification({
        userId: request.requester,
        type: 'referral_request_update',
        message: `Your referral request status has been updated to ${status}.`,
        relatedContentId: request._id
      });
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', authMiddleware, async (req, res) => {
  try {
    const { company, otp } = req.body;
    const profile = await ReferrerProfile.findOne({ user: req.user.id, company });
    
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    
    if (profile.verificationStatus !== 'Pending') {
      return res.status(400).json({ message: 'Profile is not pending verification' });
    }
    
    if (!profile.verificationCode || !profile.verificationCodeExpires || new Date() > profile.verificationCodeExpires) {
      profile.verificationStatus = 'Failed';
      await profile.save();
      return res.status(400).json({ message: 'Verification code expired or invalid' });
    }
    
    if (profile.verificationCode !== otp) {
      profile.verificationStatus = 'Failed';
      await profile.save();
      return res.status(400).json({ message: 'Incorrect verification code' });
    }
    
    profile.verificationStatus = 'Verified';
    profile.verificationTimestamp = new Date();
    await profile.save();
    
    // Optionally sync with search service if they should appear prominently
    // await syncItem('ReferrerProfile', profile);
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a referral request
router.post('/requests/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const request = await ReferralRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the original requester can rate this referral' });
    }
    
    if (request.status !== 'referred') {
      return res.status(400).json({ message: 'Can only rate completed (referred) requests' });
    }
    
    if (request.hasBeenRated) {
      return res.status(400).json({ message: 'You have already rated this referral' });
    }
    
    const newFeedback = new ReferralFeedback({
      request: request._id,
      student: req.user.id,
      referrerProfile: request.referrer_profile,
      rating,
      feedback
    });
    
    await newFeedback.save();
    
    request.hasBeenRated = true;
    await request.save();
    
    // Recalculate average rating
    const profile = await ReferrerProfile.findById(request.referrer_profile);
    const newTotal = profile.totalRatings + 1;
    const newAvg = ((profile.averageRating * profile.totalRatings) + rating) / newTotal;
    
    profile.totalRatings = newTotal;
    profile.averageRating = newAvg;
    await profile.save();
    
    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Report a referrer profile
router.post('/profiles/:id/report', authMiddleware, async (req, res) => {
  try {
    const { reasonCategory, details } = req.body;
    
    const profile = await ReferrerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    
    // Check for existing pending report by this user
    const existingReport = await ReferrerReport.findOne({
      reportedProfile: profile._id,
      reporter: req.user.id,
      status: 'Pending'
    });
    
    if (existingReport) {
      return res.status(400).json({ message: 'You already have an active report for this profile' });
    }
    
    const report = new ReferrerReport({
      reportedProfile: profile._id,
      reporter: req.user.id,
      reasonCategory,
      details
    });
    await report.save();
    
    // Count distinct reporters with Pending reports
    const distinctReporters = await ReferrerReport.distinct('reporter', {
      reportedProfile: profile._id,
      status: 'Pending'
    });
    
    profile.reportCount = distinctReporters.length;
    
    // Threshold to hide
    if (profile.reportCount >= 3 && !profile.isUnderReview) {
      profile.isUnderReview = true;
      // Remove from Unified Search
      await removeItem(profile._id);
    }
    
    await profile.save();
    
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
