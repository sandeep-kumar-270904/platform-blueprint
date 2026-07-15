const express = require('express');
const router = express.Router();
const { AMASession, AMAQuestion, AMAQuestionVote } = require('../models/AMA');
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// Create an AMA session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findOne({ user_id: req.user.id, verificationStatus: 'approved', isActive: true });
    if (!mentorProfile) return res.status(403).json({ message: 'Only approved active mentors can create AMAs' });

    const { title, description, topic, scheduled_at, duration_minutes, max_participants } = req.body;
    
    const ama = new AMASession({
      mentor_id: req.user.id,
      title,
      description,
      topic,
      scheduled_at: new Date(scheduled_at),
      duration_minutes: duration_minutes || 60,
      max_participants: max_participants || 100
    });
    
    // Provision room
    try {
      const room = await require('../services/videoService').createRoom(ama._id, ama.scheduled_at, ama.duration_minutes);
      ama.daily_room_id = room.name;
      ama.daily_room_url = room.url;
    } catch (e) {
      console.error('Failed to provision Daily room for AMA:', e);
    }

    await ama.save();
    res.status(201).json(ama);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get active AMA sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await AMASession.find({ is_active: true }).sort({ scheduled_at: 1 });
    
    const mentorUserIds = [...new Set(sessions.map(s => s.mentor_id))];
    const [profiles, mentorMeta] = await Promise.all([
      User.find({ _id: { $in: mentorUserIds } }).select('username full_name avatar_url'),
      MentorProfile.find({ user_id: { $in: mentorUserIds } }).select('user_id title company')
    ]);
    
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    const metaMap = mentorMeta.reduce((acc, m) => { acc[m.user_id] = m; return acc; }, {});
    
    const enriched = sessions.map(s => {
      const sObj = s.toObject();
      sObj.mentor_profile = profileMap[s.mentor_id] || undefined;
      sObj.mentor_meta = metaMap[s.mentor_id] || undefined;
      return sObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for an AMA
router.post('/sessions/:id/register', authMiddleware, async (req, res) => {
  try {
    const ama = await AMASession.findById(req.params.id);
    if (!ama) return res.status(404).json({ message: 'AMA not found' });
    if (ama.status !== 'upcoming') return res.status(400).json({ message: 'AMA is not upcoming' });
    
    const isRegistered = ama.registered_attendees.some(att => att.user_id.toString() === req.user.id);
    if (isRegistered) return res.status(400).json({ message: 'Already registered' });
    
    // Atomic update to strictly enforce cap
    const updated = await AMASession.findOneAndUpdate(
      { 
        _id: ama._id, 
        participant_count: { $lt: ama.max_participants } 
      },
      { 
        $push: { registered_attendees: { user_id: req.user.id } }, 
        $inc: { participant_count: 1 } 
      },
      { new: true }
    );
    
    if (!updated) {
      return res.status(409).json({ message: 'AMA just filled up. Please try another session.' });
    }

    // Send notification
    try {
      await Notification.create({
        userId: req.user.id,
        type: 'ama_registration_confirmed',
        relatedContentId: updated._id,
        message: `You successfully registered for the AMA: ${updated.title}`
      });
    } catch (sideErr) {
      console.error('Non-critical side effect failed during AMA registration:', sideErr);
    }

    res.json({ message: 'Registered successfully', ama: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Cancel AMA (by host)
router.post('/sessions/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const ama = await AMASession.findOne({ _id: req.params.id, mentor_id: req.user.id });
    if (!ama) return res.status(404).json({ message: 'AMA not found or unauthorized' });
    if (ama.status === 'completed' || ama.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel an already ended or cancelled session' });
    }

    ama.status = 'cancelled';
    await ama.save();

    // Notify all attendees
    for (const attendee of ama.registered_attendees) {
      await Notification.create({
        userId: attendee.user_id,
        type: 'ama_cancelled',
        relatedContentId: ama._id,
        message: `The AMA "${ama.title}" has been cancelled by the host.`
      });
    }

    res.json({ message: 'AMA cancelled', ama });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reschedule AMA (by host)
router.put('/sessions/:id/reschedule', authMiddleware, async (req, res) => {
  try {
    const { scheduled_at } = req.body;
    const ama = await AMASession.findOne({ _id: req.params.id, mentor_id: req.user.id });
    if (!ama) return res.status(404).json({ message: 'AMA not found or unauthorized' });
    if (ama.status !== 'upcoming') return res.status(400).json({ message: 'Can only reschedule upcoming AMAs' });

    ama.scheduled_at = new Date(scheduled_at);
    await ama.save();

    // Notify all attendees
    for (const attendee of ama.registered_attendees) {
      await Notification.create({
        userId: attendee.user_id,
        type: 'session_reminder', // Reuse session_reminder or general notification
        relatedContentId: ama._id,
        message: `The AMA "${ama.title}" has been rescheduled to ${ama.scheduled_at.toLocaleString()}.`
      });
    }

    res.json({ message: 'AMA rescheduled', ama });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add Recording URL (by host)
router.put('/sessions/:id/recording', authMiddleware, async (req, res) => {
  try {
    const { recording_url } = req.body;
    const ama = await AMASession.findOne({ _id: req.params.id, mentor_id: req.user.id });
    if (!ama) return res.status(404).json({ message: 'AMA not found or unauthorized' });

    ama.recording_url = recording_url;
    await ama.save();

    res.json({ message: 'Recording added', ama });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// -- Questions endpoints omitted for brevity but keeping them from original --
// (To not break existing frontends that rely on these routes, I'll paste them)

// Get questions for a session
router.get('/sessions/:id/questions', async (req, res) => {
  try {
    const questions = await AMAQuestion.find({ session_id: req.params.id }).sort({ upvotes: -1 });
    
    const userIds = [...new Set(questions.map(q => q.user_id))];
    const profiles = await User.find({ _id: { $in: userIds } }).select('username full_name avatar_url');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    let userVotes = [];
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const votes = await AMAQuestionVote.find({
          user_id: decoded.id,
          question_id: { $in: questions.map(q => q._id) }
        });
        userVotes = votes.map(v => v.question_id.toString());
      } catch (err) {}
    }
    
    const enriched = questions.map(q => {
      const qObj = q.toObject();
      qObj.user_profile = profileMap[q.user_id] || undefined;
      qObj.has_voted = userVotes.includes(q._id.toString());
      return qObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Ask a question
router.post('/sessions/:id/questions', authMiddleware, async (req, res) => {
  try {
    const question = new AMAQuestion({
      session_id: req.params.id,
      user_id: req.user.id,
      question: req.body.question
    });
    
    await question.save();
    
    if (req.io) {
      req.io.emit(`ama-q-${req.params.id}`, { action: 'new_question', data: question });
    }
    
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle vote on a question
router.post('/questions/:id/vote', authMiddleware, async (req, res) => {
  try {
    const existing = await AMAQuestionVote.findOne({
      question_id: req.params.id,
      user_id: req.user.id
    });
    
    const question = await AMAQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    if (existing) {
      await AMAQuestionVote.deleteOne({ _id: existing._id });
      question.upvotes = Math.max(0, question.upvotes - 1);
    } else {
      const vote = new AMAQuestionVote({
        question_id: req.params.id,
        user_id: req.user.id
      });
      await vote.save();
      question.upvotes += 1;
    }
    
    await question.save();
    
    if (req.io) {
      req.io.emit(`ama-q-${question.session_id}`, { action: 'vote_update', question_id: question._id, upvotes: question.upvotes });
    }
    
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
