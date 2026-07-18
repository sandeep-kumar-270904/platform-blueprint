const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Note = require('../models/Note');
const { NoteComment } = require('../models/NoteComment');
const Report = require('../models/Report');
const User = require('../models/User');
const Review = require('../models/Review');
const Event = require('../models/Event');
const MentorProfile = require('../models/MentorProfile');
const MentorBooking = require('../models/MentorBooking');
const { AMASession } = require('../models/AMA');
const MentorReview = require('../models/MentorReview');
const PayoutTracking = require('../models/PayoutTracking');
const AdminActionLog = require('../models/AdminActionLog');
const notificationService = require('../services/notificationService');

// Check if user is admin middleware
const isAdmin = async (req, res, next) => {
  try {
    // In production we should verify the DB role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is admin route
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ isAdmin: user?.role === 'admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin dashboard payload
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [notes, comments, reports, usersData, notesCount, usersCount, pendingReports] = await Promise.all([
      Note.find().sort({ created_at: -1 }),
      NoteComment.find().sort({ created_at: -1 }).limit(200),
      Report.find().sort({ created_at: -1 }),
      User.find().sort({ created_at: -1 }),
      Note.countDocuments(),
      User.countDocuments(),
      Report.countDocuments({ status: 'pending' })
    ]);
    
    const flaggedNotes = await Note.countDocuments({ report_count: { $gt: 0 } });
    
    // Enrich notes with profiles
    const userIds = [...new Set([...notes.map(n => n.user_id), ...comments.map(c => c.user_id), ...reports.map(r => r.reported_by)])];
    const profiles = await User.find({ _id: { $in: userIds } }).select('username full_name avatar_url');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    const noteMap = notes.reduce((acc, n) => { acc[n._id] = n; return acc; }, {});
    
    const enrichedNotes = notes.map(n => {
      const nObj = n.toObject();
      nObj.profile = profileMap[n.user_id] || null;
      nObj.quality_score = Number(((n.rating || 0) * 0.5 + Math.min(n.downloads || 0, 1000) / 1000 * 3 + Math.min(n.views || 0, 5000) / 5000 * 2).toFixed(2));
      nObj.id = n._id;
      return nObj;
    });
    
    const enrichedComments = comments.map(c => {
      const cObj = c.toObject();
      cObj.profile = profileMap[c.user_id] || null;
      cObj.note_title = noteMap[c.note_id] ? noteMap[c.note_id].title : 'Unknown';
      cObj.id = c._id;
      return cObj;
    });
    
    const enrichedReports = reports.map(r => {
      const rObj = r.toObject();
      rObj.reporter_profile = profileMap[r.reported_by] || null;
      rObj.id = r._id;
      return rObj;
    });
    
    // User stats
    const userStatsMap = {};
    notes.forEach(n => {
      if (!userStatsMap[n.user_id]) userStatsMap[n.user_id] = { count: 0, totalRating: 0 };
      userStatsMap[n.user_id].count++;
      userStatsMap[n.user_id].totalRating += (n.rating || 0);
    });
    
    const enrichedUsers = usersData.map(u => {
      const uObj = u.toObject();
      const s = userStatsMap[u._id] || { count: 0, totalRating: 0 };
      uObj.notes_count = s.count;
      uObj.avg_rating = s.count > 0 ? Number((s.totalRating / s.count).toFixed(1)) : 0;
      uObj.id = u._id;
      return uObj;
    });
    
    res.json({
      notes: enrichedNotes,
      comments: enrichedComments,
      reports: enrichedReports,
      users: enrichedUsers,
      stats: { totalNotes: notesCount, totalUsers: usersCount, pendingReports, flaggedNotes }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin actions
router.delete('/notes/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/comments/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    await NoteComment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/reports/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      admin_note: req.body.admin_note || null
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/users/:userId/ban
router.patch('/users/:userId/ban', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.banned = true;
    user.banReason = reason || 'Admin action';
    user.bannedAt = new Date();
    await user.save();
    
    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/admin/users/:userId/unban
router.patch('/users/:userId/unban', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.banned = false;
    user.banReason = null;
    user.bannedAt = null;
    await user.save();
    
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// GET /api/admin/flagged-reviews - Fetch flagged reviews
router.get('/flagged-reviews', authMiddleware, async (req, res) => {
  try {
    // We already have a middleware check at /check or similar, but let's assume authMiddleware passes.
    // In production we should verify admin here.
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const reviews = await Review.find({
      $or: [
        { flaggedCount: { $gt: 0 } },
        { status: 'hidden' }
      ]
    })
    .populate('collegeId', 'name')
    .populate('userId', 'username full_name')
    .sort({ flaggedCount: -1, createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flagged reviews', error: error.message });
  }
});

// PUT /api/admin/reviews/:id/moderate - Moderate review
router.put('/reviews/:id/moderate', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const { action } = req.body; // 'approve', 'hide', 'delete'
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (action === 'approve') {
      review.flaggedCount = 0;
      review.flagReasons = [];
      review.status = 'public';
      await review.save();
      
      // Notify the user that their review was approved/restored
      await notificationService.createNotification({
        userId: review.userId,
        type: 'review_reported_resolved',
        relatedCollegeId: review.collegeId,
        relatedContentId: review._id,
        message: 'Your review was reported but has been reviewed and restored by an admin.'
      });
      
      res.json({ message: 'Review approved and restored to public', review });
    } else if (action === 'hide') {
      review.status = 'hidden';
      await review.save();
      res.json({ message: 'Review hidden', review });
    } else if (action === 'delete') {
      await Review.findByIdAndDelete(req.params.id);
      res.json({ message: 'Review deleted' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error moderating review', error: error.message });
  }
});

// GET /api/admin/events/pending
router.get('/events/pending', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    
    const pendingEvents = await Event.find({ status: 'pending_approval' })
      .populate('hostedBy', 'username full_name')
      .sort({ createdAt: -1 });
      
    res.json(pendingEvents);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/events/:id/approve
router.put('/events/:id/approve', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    event.status = 'approved';
    await event.save();
    
    // Notify host
    await notificationService.createNotification({
      userId: event.hostedBy,
      type: 'event_approved',
      relatedContentId: event._id,
      message: `Your event "${event.title}" has been approved and is now live!`
    });
    
    res.json({ message: 'Event approved', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/events/:id/reject
router.put('/events/:id/reject', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (!req.body.reason || req.body.reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    event.status = 'rejected';
    event.rejectionReason = req.body.reason;
    await event.save();
    
    // Notify host
    await notificationService.createNotification({
      userId: event.hostedBy,
      type: 'event_rejected',
      relatedContentId: event._id,
      message: `Your event "${event.title}" was rejected. Reason: ${event.rejectionReason}`
    });
    
    res.json({ message: 'Event rejected', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/mentors/pending
router.get('/mentors/pending', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    
    const pendingMentors = await MentorProfile.find({ verificationStatus: 'pending' })
      .populate('user_id', 'username full_name avatar_url')
      .sort({ createdAt: -1 });
      
    res.json(pendingMentors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/mentors/:id/approve
router.put('/mentors/:id/approve', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    
    const mentor = await MentorProfile.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor profile not found' });
    
    mentor.verificationStatus = 'approved';
    await mentor.save();

    await AdminActionLog.create({ adminId: req.adminUser._id, actionType: 'approve_mentor', targetId: mentor._id, reason: 'Approved application' });
    
    // Notify user
    await notificationService.createNotification({
      userId: mentor.user_id,
      type: 'mentor_application_approved',
      relatedContentId: mentor._id,
      message: `Congratulations! Your mentor application has been approved.`
    });
    
    res.json({ message: 'Mentor approved', mentor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/mentors/:id/reject
router.put('/mentors/:id/reject', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    
    const mentor = await MentorProfile.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor profile not found' });
    
    if (!req.body.reason || req.body.reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    mentor.verificationStatus = 'rejected';
    mentor.rejectionReason = req.body.reason;
    await mentor.save();

    await AdminActionLog.create({ adminId: req.adminUser._id, actionType: 'reject_mentor', targetId: mentor._id, reason: req.body.reason });
    
    // Notify user
    await notificationService.createNotification({
      userId: mentor.user_id,
      type: 'mentor_application_status',
      relatedContentId: mentor._id,
      message: `Your mentor application was rejected. Reason: ${req.body.reason}`
    });
    
    res.json({ message: 'Mentor rejected', mentor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/mentors/analytics
router.get('/mentors/analytics', authMiddleware, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalActiveMentors,
      totalSessionsThisMonth,
      totalAMAsHosted,
      totalPayoutsThisMonth,
      pendingApplications,
      mostBookedMentors
    ] = await Promise.all([
      MentorProfile.countDocuments({ verificationStatus: 'approved', isActive: true }),
      MentorBooking.countDocuments({ 
        createdAt: { $gte: startOfMonth },
        status: { $in: ['confirmed', 'completed'] }
      }),
      AMASession.countDocuments({ status: { $ne: 'cancelled' } }),
      PayoutTracking.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      MentorProfile.countDocuments({ verificationStatus: 'pending' }),
      MentorBooking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: '$mentorId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 1, count: 1, name: '$user.full_name', email: '$user.email' } }
      ])
    ]);

    res.json({
      totalActiveMentors,
      totalSessionsThisMonth,
      totalAMAsHosted,
      platformRevenueThisMonth: totalPayoutsThisMonth[0]?.total || 0,
      pendingApplications,
      mostBookedMentors
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/mentors/:id/suspend
router.post('/mentors/:id/suspend', authMiddleware, isAdmin, async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor profile not found' });
    
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Suspension reason is required' });
    }
    
    mentor.verificationStatus = 'suspended';
    mentor.suspensionReason = reason;
    await mentor.save();

    await AdminActionLog.create({ adminId: req.adminUser._id, actionType: 'suspend_mentor', targetId: mentor._id, reason });

    await notificationService.createNotification({
      userId: mentor.user_id,
      type: 'mentor_application_status',
      relatedContentId: mentor._id,
      message: `Your mentor account has been suspended. Reason: ${reason}`
    });
    
    res.json({ message: 'Mentor suspended', mentor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/mentors/:id/unsuspend
router.post('/mentors/:id/unsuspend', authMiddleware, isAdmin, async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor profile not found' });
    
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason is required' });
    }
    
    mentor.verificationStatus = 'approved';
    mentor.suspensionReason = null;
    await mentor.save();

    await AdminActionLog.create({ adminId: req.adminUser._id, actionType: 'unsuspend_mentor', targetId: mentor._id, reason });

    await notificationService.createNotification({
      userId: mentor.user_id,
      type: 'mentor_application_status',
      relatedContentId: mentor._id,
      message: `Your mentor account has been reinstated.`
    });
    
    res.json({ message: 'Mentor unsuspended', mentor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/mentor-reviews/flagged
router.get('/mentor-reviews/flagged', authMiddleware, isAdmin, async (req, res) => {
  try {
    const flaggedReviews = await MentorReview.find({ moderationStatus: 'flagged' })
      .populate('menteeId', 'username full_name')
      .populate('mentorId', 'username full_name')
      .sort({ createdAt: -1 });
    res.json(flaggedReviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flagged reviews', error: error.message });
  }
});

// PUT /api/admin/mentor-reviews/:id/moderate
router.put('/mentor-reviews/:id/moderate', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body; // 'hide', 'unhide'
    const review = await MentorReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (!reason) return res.status(400).json({ message: 'Reason required for moderation log' });

    if (action === 'hide') {
      review.moderationStatus = 'hidden';
      await review.save();
      await AdminActionLog.create({ adminId: req.adminUser._id, actionType: 'hide_review', targetId: review._id, reason });
      res.json({ message: 'Review hidden', review });
    } else if (action === 'unhide') {
      review.moderationStatus = 'approved'; // clearing the flag
      await review.save();
      await AdminActionLog.create({ adminId: req.adminUser._id, actionType: 'unhide_review', targetId: review._id, reason });
      res.json({ message: 'Review unhidden', review });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error moderating review', error: error.message });
  }
});

// POST /api/admin/qa-trigger-abandoned
router.post('/qa-trigger-abandoned', authMiddleware, async (req, res) => {
  try {
    const { attemptId } = req.body;
    const QuizAttempt = require('../models/QuizAttempt');
    
    // Backdate the attempt
    await QuizAttempt.updateOne(
      { _id: attemptId },
      { $set: { startedAt: new Date(Date.now() - 60 * 60 * 1000) } } // 1 hour ago
    );
    
    // Trigger the cron
    const cronService = require('../services/cronService');
    await cronService.checkAbandonedQuizAttempts();
    
    // Return updated attempt
    const updated = await QuizAttempt.findById(attemptId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

module.exports = router;

