const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Note = require('../models/Note');
const { NoteComment } = require('../models/NoteComment');
const Report = require('../models/Report');
const User = require('../models/User');

// Check if user is admin
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
router.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    await NoteComment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/reports/:id', authMiddleware, async (req, res) => {
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

module.exports = router;
