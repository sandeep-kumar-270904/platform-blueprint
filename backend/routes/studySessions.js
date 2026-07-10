const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const StudySession = require('../models/StudySession');
const StudySessionParticipant = require('../models/StudySessionParticipant');
const StudySessionMessage = require('../models/StudySessionMessage');
const StudySessionAnnotation = require('../models/StudySessionAnnotation');
const User = require('../models/User');
const Note = require('../models/Note');

// GET /api/study-sessions - Get active sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await StudySession.find({ is_active: true }).sort({ created_at: -1 });
    
    // Enrich with host profiles and note titles
    const hostIds = [...new Set(sessions.map(s => s.host_id))];
    const hosts = await User.find({ _id: { $in: hostIds } }).select('username avatar_url');
    const hostMap = hosts.reduce((acc, h) => { acc[h._id] = h; return acc; }, {});
    
    const noteIds = [...new Set(sessions.map(s => s.note_id))];
    const notes = await Note.find({ _id: { $in: noteIds } }).select('title');
    const noteMap = notes.reduce((acc, n) => { acc[n._id] = n; return acc; }, {});
    
    const enriched = sessions.map(s => {
      const sObj = s.toObject();
      sObj.profiles = hostMap[s.host_id];
      sObj.notes = noteMap[s.note_id];
      return sObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/study-sessions/:id - Get session details
router.get('/:id', async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    const note = await Note.findById(session.note_id).select('title');
    const host = await User.findById(session.host_id).select('username avatar_url');
    
    const sObj = session.toObject();
    sObj.notes = note;
    sObj.profiles = host;
    
    res.json(sObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study-sessions/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const participant = new StudySessionParticipant({
      session_id: req.params.id,
      user_id: req.user.id
    });
    await participant.save();
    res.json({ message: 'Joined successfully' });
  } catch (error) {
    if (error.code === 11000) return res.json({ message: 'Already joined' }); // duplicate key ignore
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study-sessions/:id/leave
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    await StudySessionParticipant.findOneAndDelete({ session_id: req.params.id, user_id: req.user.id });
    res.json({ message: 'Left successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/study-sessions/:id/participants
router.get('/:id/participants', authMiddleware, async (req, res) => {
  try {
    const participants = await StudySessionParticipant.find({ session_id: req.params.id });
    const userIds = participants.map(p => p.user_id);
    const users = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const userMap = users.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const enriched = participants.map(p => {
      const pObj = p.toObject();
      pObj.profiles = userMap[p.user_id];
      return pObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/study-sessions/:id/messages
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await StudySessionMessage.find({ session_id: req.params.id }).sort({ created_at: 1 });
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const users = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const userMap = users.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const enriched = messages.map(m => {
      const mObj = m.toObject();
      mObj.profiles = userMap[m.user_id];
      return mObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study-sessions/:id/messages
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const newMessage = new StudySessionMessage({
      session_id: req.params.id,
      user_id: req.user.id,
      message: req.body.message
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/study-sessions/:id/annotations
router.get('/:id/annotations', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const annotations = await StudySessionAnnotation.find({ session_id: req.params.id, page_number: page });
    
    const userIds = [...new Set(annotations.map(a => a.user_id))];
    const users = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const userMap = users.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const enriched = annotations.map(a => {
      const aObj = a.toObject();
      aObj.profiles = userMap[a.user_id];
      return aObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study-sessions/:id/annotations
router.post('/:id/annotations', authMiddleware, async (req, res) => {
  try {
    const annotation = new StudySessionAnnotation({
      session_id: req.params.id,
      note_id: req.body.note_id,
      user_id: req.user.id,
      page_number: req.body.page_number,
      position: req.body.position,
      color: req.body.color
    });
    await annotation.save();
    res.status(201).json(annotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study-sessions/:id/sync-page
router.post('/:id/sync-page', authMiddleware, async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    
    session.current_page = req.body.current_page;
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
