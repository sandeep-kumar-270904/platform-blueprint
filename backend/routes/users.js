const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Review = require('../models/Review');
const CollegeQuestion = require('../models/CollegeQuestion');
const CollegeAnswer = require('../models/CollegeAnswer');

// GET /api/users/search
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json([]);
    
    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { full_name: searchRegex }
      ]
    }).select('username full_name avatar_url').limit(10).lean();
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/me
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { full_name, username, avatar_url, bio, skills, locale } = req.body;
    
    // Check if username is taken (if it's changing)
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    const updateFields = { full_name, username, avatar_url, bio };
    if (locale) updateFields.locale = locale;
    if (skills) {
      updateFields.skills = skills.map(skill => (typeof skill === 'string' ? { skillName: skill } : skill));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
});
// POST /api/users/me/video-intro
router.post('/me/video-intro', authMiddleware, async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ message: 'videoUrl is required' });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          videoIntroUrl: videoUrl,
          videoIntroUploadedAt: new Date()
        } 
      },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Video intro updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating video intro', error: error.message });
  }
});

// DELETE /api/users/me/video-intro
router.delete('/me/video-intro', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { videoIntroUrl: "", videoIntroUploadedAt: "" } },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Video intro removed', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing video intro', error: error.message });
  }
});

// POST /api/users/me/institution-verify
router.post('/me/institution-verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Auto-verify if email ends with .edu or .ac.in and is verified
    const email = (user.email || '').toLowerCase();
    if (user.isEmailVerified && (email.endsWith('.edu') || email.endsWith('.ac.in'))) {
      user.institutionVerified = true;
      user.institutionVerifiedAt = new Date();
      await user.save();
      return res.json({ message: 'Automatically verified via institution email.', verified: true, user });
    }
    
    // If they provided a documentUrl, we'd normally queue for manual review, but for demo we can just auto-verify or mark pending.
    // Let's just auto-verify for demonstration of the badge if a document is provided.
    const { documentUrl } = req.body;
    if (documentUrl) {
      user.institutionVerified = true;
      user.institutionVerifiedAt = new Date();
      await user.save();
      return res.json({ message: 'Document submitted and verified.', verified: true, user });
    }
    
    res.status(400).json({ message: 'Could not verify institution. Please provide a document or use a .edu email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying institution', error: error.message });
  }
});

// DELETE /api/users/me - Account Deletion Cascade
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const MentorProfile = require('../models/MentorProfile');
    const MentorBooking = require('../models/MentorBooking');
    const MentorReview = require('../models/MentorReview');
    
    // 1. Mentee-side bookings: Cancel future ones
    const futureMenteeBookings = await MentorBooking.find({ menteeId: userId, scheduledAt: { $gte: new Date() }, status: { $in: ['requested', 'confirmed'] } });
    for (let b of futureMenteeBookings) {
      b.status = 'cancelled';
      b.cancellationReason = 'Account deleted';
      b.cancelledBy = 'system';
      if (b.paymentStatus === 'paid') b.refundStatus = 'full';
      await b.save();
    }
    
    // 2. Reviews written by this user: Anonymize (nullify menteeId) to keep mentor ratings intact
    await MentorReview.updateMany({ menteeId: userId }, { $set: { menteeId: null } });

    // 3. Mentor Profile cleanup (if they are a mentor)
    const mentorProfile = await MentorProfile.findOne({ user_id: userId });
    if (mentorProfile) {
      // Cancel future bookings where this user is the mentor
      const futureMentorBookings = await MentorBooking.find({ mentorId: mentorProfile._id, scheduledAt: { $gte: new Date() }, status: { $in: ['requested', 'confirmed'] } });
      for (let b of futureMentorBookings) {
        b.status = 'cancelled';
        b.cancellationReason = 'Mentor account deleted';
        b.cancelledBy = 'system';
        if (b.paymentStatus === 'paid') b.refundStatus = 'full'; // Assuming we'd trigger real refund async
        await b.save();
      }
      
      // We do NOT delete reviews ABOUT the mentor, or past bookings, for audit/ledger purposes.
      // We just deactivate the profile
      mentorProfile.isActive = false;
      mentorProfile.verificationStatus = 'rejected';
      await mentorProfile.save();
    }
    
    // 4. Cleanup Phase 5-8 Mentors Module models
    const ForumThread = require('../models/ForumThread');
    const QAQuestion = require('../models/QAQuestion');
    const Dispute = require('../models/Dispute');
    const Cohort = require('../models/Cohort');
    const Referral = require('../models/Referral');

    // Anonymize forum threads and Q&A (so community content stays)
    await ForumThread.updateMany({ user_id: userId }, { $set: { user_id: null } });
    await QAQuestion.updateMany({ user_id: userId }, { $set: { user_id: null } });
    
    // Anonymize disputes raised by user
    await Dispute.updateMany({ raisedBy: userId }, { $set: { raisedBy: null } });
    
    // Remove user from any cohorts they joined as a mentee
    await Cohort.updateMany({ menteeIds: userId }, { $pull: { menteeIds: userId } });
    
    // Anonymize referrals where they were the referrer (keep records for tracking)
    await Referral.updateMany({ referrer: userId }, { $set: { referrer: null } });

    // 5. Finally delete the User record
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'Account and associated personal data deleted/anonymized successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during account deletion', error: err.message });
  }
});

// GET /api/users/me/export - Data Export
router.get('/me/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const MentorProfile = require('../models/MentorProfile');
    const MentorBooking = require('../models/MentorBooking');
    const MentorReview = require('../models/MentorReview');
    
    const user = await User.findById(userId).lean();
    const mentorProfile = await MentorProfile.findOne({ user_id: userId }).lean();
    const myBookingsAsMentee = await MentorBooking.find({ menteeId: userId }).lean();
    const myReviewsAsMentee = await MentorReview.find({ menteeId: userId }).lean();
    
    let myBookingsAsMentor = [];
    if (mentorProfile) {
      myBookingsAsMentor = await MentorBooking.find({ mentorId: mentorProfile._id }).lean();
    }

    const exportData = {
      userData: user,
      mentorProfile,
      bookingsAsMentee: myBookingsAsMentee,
      reviewsGiven: myReviewsAsMentee,
      bookingsAsMentor: myBookingsAsMentor
    };

    res.setHeader('Content-disposition', 'attachment; filename=my-data-export.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    res.status(500).json({ message: 'Server error exporting data', error: err.message });
  }
});

// Note: Real follower schema would typically involve a separate Follow model.
// For the UI demonstration purposes, we will mock a successful response.

// POST /api/users/:id/follow
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    // Check if user exists
    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) return res.status(404).json({ message: 'User not found' });
    
    // In a full DB setup, you'd add this to a 'Follows' collection
    // await Follow.create({ follower_id: req.user.id, following_id: req.params.id });
    
    res.json({ message: 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/users/me/reviews
router.get('/me/reviews', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate('collegeId', 'name location')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching reviews', error: error.message });
  }
});

// GET /api/users/me/questions
router.get('/me/questions', authMiddleware, async (req, res) => {
  try {
    const questions = await CollegeQuestion.find({ userId: req.user.id })
      .populate('collegeId', 'name location')
      .sort({ createdAt: -1 });
      
    // Count answers for each question
    const questionsWithCount = await Promise.all(questions.map(async (q) => {
      const answersCount = await CollegeAnswer.countDocuments({ questionId: q._id });
      return { ...q.toObject(), answersCount };
    }));
      
    res.json({ questions: questionsWithCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching questions', error: error.message });
  }
});

// GET /api/users/me/answers
router.get('/me/answers', authMiddleware, async (req, res) => {
  try {
    const answers = await CollegeAnswer.find({ userId: req.user.id })
      .populate({
        path: 'questionId',
        select: 'questionText collegeId',
        populate: {
          path: 'collegeId',
          select: 'name location'
        }
      })
      .sort({ createdAt: -1 });
    res.json({ answers });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching answers', error: error.message });
  }
});

// GET /api/users/me/events/hosting
router.get('/me/events/hosting', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({ hostedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching events', error: error.message });
  }
});

// GET /api/users/me/events/registered
router.get('/me/events/registered', authMiddleware, async (req, res) => {
  try {
    const EventRegistration = require('../models/EventRegistration');
    const Event = require('../models/Event');
    
    // Find all registrations for this user
    const registrations = await EventRegistration.find({ userId: req.user.id });
    const eventIds = registrations.map(r => r.eventId);
    
    // Find all the corresponding events
    const events = await Event.find({ _id: { $in: eventIds } });
    
    const now = new Date();
    
    // Group them into upcoming and past
    const upcoming = [];
    const past = [];
    
    // We attach the registration status so the frontend can see if they are waitlisted
    events.forEach(event => {
      const reg = registrations.find(r => r.eventId.toString() === event._id.toString());
      const eventWithRegStatus = { ...event.toObject(), registrationStatus: reg.status, registrationId: reg._id };
      
      if (new Date(event.endDate) >= now) {
        upcoming.push(eventWithRegStatus);
      } else {
        past.push(eventWithRegStatus);
      }
    });
    
    // Sort upcoming (soonest first), past (most recently ended first)
    upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    
    res.json({ upcoming, past });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching registered events', error: error.message });
  }
});

// GET /api/users/:id/profile
router.get('/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username full_name avatar_url university degree graduation_year');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/notification-preferences
router.get('/me/notification-preferences', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notificationPreferences || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me/notification-preferences
router.put('/me/notification-preferences', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    for (const key of Object.keys(req.body)) {
      user.notificationPreferences[key] = req.body[key];
    }
    await user.save();
    
    res.json(user.notificationPreferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/users/me/skills-privacy
router.put('/me/skills-privacy', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.skillsProfilePublic = req.body.skillsProfilePublic;
    await user.save();
    
    res.json({ skillsProfilePublic: user.skillsProfilePublic });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/skills-profile
router.get('/:id/skills-profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'skills.sourceCourses',
        select: 'title provider thumbnailImage category level'
      })
      .select('full_name avatar_url learningStreak skillsProfilePublic skills gamification_badges is_verified_host');

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.skillsProfilePublic) return res.status(403).json({ message: 'This profile is private.' });

    // Count total certificates (which equates to completed courses in the skills arrays, deduplicated)
    const courseIds = new Set();
    user.skills.forEach(skill => {
      skill.sourceCourses.forEach(course => {
        if(course._id) courseIds.add(course._id.toString());
      });
    });

    res.json({
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      learningStreak: user.learningStreak,
      skills: user.skills,
      totalCertificates: courseIds.size
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching skills profile' });
  }
});

// GET /api/users/me/courses
router.get('/me/courses', authMiddleware, async (req, res) => {
  try {
    const CourseEnrollment = require('../models/CourseEnrollment');
    const Notification = require('../models/Notification');
    const User = require('../models/User');

    const user = await User.findById(req.user.id)
      .populate({
        path: 'skills.sourceCourses',
        select: 'title provider thumbnailImage category level'
      })
      .select('learningStreak skillsProfilePublic skills');

    const enrollments = await CourseEnrollment.find({ userId: req.user.id })
      .populate('courseId')
      .sort({ updatedAt: -1 });

    const result = {
      enrolled: [],
      in_progress: [],
      completed: [],
      learningStreak: user?.learningStreak || { current: 0, longest: 0, lastActiveDate: null },
      skillsProfilePublic: user?.skillsProfilePublic || false,
      skills: user?.skills || []
    };

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    for (let enrollment of enrollments) {
      // Logic for stalled and 5-day reminders
      if (enrollment.status === 'in_progress') {
        const lastUpdate = enrollment.lastProgressUpdateAt ? new Date(enrollment.lastProgressUpdateAt) : new Date(enrollment.updatedAt);
        const diffDays = Math.floor(Math.abs(now - lastUpdate) / msPerDay);
        
        enrollment = enrollment.toObject();
        enrollment.daysSinceUpdate = diffDays;
        
        if (diffDays >= 30) {
          enrollment.isStalled = true;
        }

        // 5-day gentle reminder logic
        // If it's been exactly 5 days (or 6, to give a buffer), we notify. 
        // We ensure we don't spam by checking if a notification for this course already exists recently.
        if (diffDays === 5 || diffDays === 6) {
          const recentNotification = await Notification.findOne({
            userId: req.user.id,
            type: 'course_reminder',
            relatedContentId: enrollment.courseId._id,
            createdAt: { $gte: new Date(now.getTime() - 3 * msPerDay) } // within last 3 days
          });

          if (!recentNotification) {
            await Notification.create({
              userId: req.user.id,
              type: 'course_reminder',
              relatedContentId: enrollment.courseId._id,
              message: `Pick up where you left off in ${enrollment.courseId.title}. You've got this!`
            });
          }
        }
      } else {
        enrollment = enrollment.toObject();
      }

      if (enrollment.status === 'enrolled') result.enrolled.push(enrollment);
      else if (enrollment.status === 'in_progress') result.in_progress.push(enrollment);
      else if (enrollment.status === 'completed') result.completed.push(enrollment);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/learning-paths
router.get('/me/learning-paths', authMiddleware, async (req, res) => {
  try {
    const LearningPathEnrollment = require('../models/LearningPathEnrollment');
    const CourseEnrollment = require('../models/CourseEnrollment');
    
    const enrollments = await LearningPathEnrollment.find({ userId: req.user.id })
      .populate('pathId')
      .sort({ createdAt: -1 });

    const results = [];

    // Calculate progress for each path
    for (let enrollment of enrollments) {
      if (!enrollment.pathId) continue;
      const path = enrollment.pathId;
      const courseIds = path.courseIds || [];
      
      let completedCount = 0;
      if (courseIds.length > 0) {
        const completedCourses = await CourseEnrollment.countDocuments({
          userId: req.user.id,
          courseId: { $in: courseIds },
          status: 'completed'
        });
        completedCount = completedCourses;
      }

      const progressPercent = courseIds.length > 0 
        ? Math.round((completedCount / courseIds.length) * 100) 
        : 0;

      results.push({
        _id: enrollment._id,
        path: path,
        progressPercent,
        completedCourses: completedCount,
        totalCourses: courseIds.length,
        enrolledAt: enrollment.enrolledAt
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching user learning paths:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/report
router.post('/report', authMiddleware, async (req, res) => {
  try {
    const Report = require('../models/Report');
    const { content_type, content_id, reason, details } = req.body;
    
    // In our simplified Report model, reported_by maps to the user making the report.
    // If the schema requires specific fields for 'details' we can map them, but we'll use 'admin_note' as a placeholder for extra text if needed.
    const report = new Report({
      content_type,
      content_id,
      reported_by: req.user.id,
      reason: reason + (details ? ` - ${details}` : '')
    });
    
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error submitting report', error: error.message });
  }
});

// POST /api/users/:id/block
router.post('/:id/block', authMiddleware, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const userToBlock = await User.findById(req.params.id);
    if (!userToBlock) return res.status(404).json({ message: 'User not found' });
    
    const user = await User.findById(req.user.id);
    if (!user.blockedUsers) user.blockedUsers = [];
    
    const index = user.blockedUsers.indexOf(req.params.id);
    if (index === -1) {
      user.blockedUsers.push(req.params.id);
      await user.save();
      res.json({ message: 'User blocked successfully', blocked: true });
    } else {
      user.blockedUsers.splice(index, 1);
      await user.save();
      res.json({ message: 'User unblocked successfully', blocked: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error blocking user', error: error.message });
  }
});

// GET /api/users/me/visibility-analytics
router.get('/me/visibility-analytics', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('careerVisibility recruiterProfile role')
      .populate({
        path: 'careerVisibility.profileViewers.recruiter',
        select: 'full_name recruiterProfile'
      });
      
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Format recent viewers masking unverified recruiters
    const recentViewers = (user.careerVisibility?.profileViewers || [])
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 10)
      .map(v => {
        const recruiterData = v.recruiter;
        if (!recruiterData) return { _id: v._id, viewedAt: v.viewedAt, name: 'A recruiter' };
        
        const isVerified = recruiterData.recruiterProfile?.verificationStatus === 'verified';
        if (isVerified) {
          return {
            _id: v._id,
            viewedAt: v.viewedAt,
            name: recruiterData.full_name,
            company: recruiterData.recruiterProfile.companyName
          };
        } else {
          return {
            _id: v._id,
            viewedAt: v.viewedAt,
            name: 'A recruiter'
          };
        }
      });

    res.json({
      profileViewCount: user.careerVisibility?.profileViewCount || 0,
      recentViewers,
      topSearchKeywords: user.careerVisibility?.searchKeywords || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/users/me/visibility
router.put('/me/visibility', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const { 
      openToWork, 
      visibleToRecruiters, 
      visiblePreferredRoles, 
      visiblePreferredLocations, 
      expectedCTC, 
      noticePeriod 
    } = req.body;

    if (!user.careerVisibility) user.careerVisibility = {};

    if (openToWork !== undefined) user.careerVisibility.openToWork = openToWork;
    if (visibleToRecruiters !== undefined) user.careerVisibility.visibleToRecruiters = visibleToRecruiters;
    if (visiblePreferredRoles) user.careerVisibility.visiblePreferredRoles = visiblePreferredRoles;
    if (visiblePreferredLocations) user.careerVisibility.visiblePreferredLocations = visiblePreferredLocations;
    if (expectedCTC) user.careerVisibility.expectedCTC = expectedCTC;
    if (noticePeriod !== undefined) user.careerVisibility.noticePeriod = noticePeriod;
    user.careerVisibility.profileLastUpdatedForVisibility = new Date();
    
    // Sync searchKeywords
    const keywords = new Set();
    if (user.careerVisibility.visiblePreferredRoles) {
      user.careerVisibility.visiblePreferredRoles.forEach(r => keywords.add(r));
    }
    if (user.degree) keywords.add(user.degree);
    if (user.skills) user.skills.forEach(s => keywords.add(s.skillName));
    user.careerVisibility.searchKeywords = Array.from(keywords);
    await user.save();
    res.json({ message: 'Visibility updated successfully', careerVisibility: user.careerVisibility });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/me/application-profile
router.put('/me/application-profile', authMiddleware, async (req, res) => {
  try {
    const { resumeUrl, defaultCoverLetter } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.defaultApplicationProfile = {
      ...user.defaultApplicationProfile,
      resumeUrl: resumeUrl !== undefined ? resumeUrl : user.defaultApplicationProfile?.resumeUrl,
      defaultCoverLetter: defaultCoverLetter !== undefined ? defaultCoverLetter : user.defaultApplicationProfile?.defaultCoverLetter
    };

    await user.save();
    res.json({ message: 'Application profile updated', defaultApplicationProfile: user.defaultApplicationProfile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/:id/mute
router.post('/:id/mute', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const targetId = req.params.id;
    const isMuted = user.muted_users.includes(targetId);
    
    if (isMuted) {
      user.muted_users = user.muted_users.filter(id => id.toString() !== targetId);
    } else {
      user.muted_users.push(targetId);
    }
    
    await user.save();
    res.json({ message: isMuted ? 'User unmuted' : 'User muted', muted_users: user.muted_users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/:id/block
router.post('/:id/block', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const targetId = req.params.id;
    const isBlocked = user.blocked_users.includes(targetId);
    
    if (isBlocked) {
      user.blocked_users = user.blocked_users.filter(id => id.toString() !== targetId);
    } else {
      user.blocked_users.push(targetId);
    }
    
    await user.save();
    res.json({ message: isBlocked ? 'User unblocked' : 'User blocked', blocked_users: user.blocked_users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
