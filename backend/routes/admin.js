const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Note = require('../models/Note');
const { NoteComment } = require('../models/NoteComment');
const Report = require('../models/Report');
const User = require('../models/User');
const Review = require('../models/Review');
const Event = require('../models/Event');
const notificationService = require('../services/notificationService');

// Check if user is admin middleware
const isAdmin = async (req, res, next) => {
  try {
    // In production we should verify the DB role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is admin route
router.get('/check', authMiddleware, async (req, res) => {
  try {
    // For blueprint testing, temporarily return true for any authenticated user
    // In production: const user = await User.findById(req.user.id); res.json({ isAdmin: user.role === 'admin' });
    res.json({ isAdmin: true });
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
    
    event.status = 'rejected';
    event.rejectionReason = req.body.reason || 'No reason provided';
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

module.exports = router;
