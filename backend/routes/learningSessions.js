const express = require('express');
const router = express.Router();
const { LearningSession, LearningSessionParticipant } = require('../models/LearningSession');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// Get upcoming sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await LearningSession.find().sort({ scheduled_at: 1 });
    
    // Fetch host profiles for these sessions
    const hostIds = [...new Set(sessions.map(s => s.host_id))];
    const hosts = await User.find({ _id: { $in: hostIds } }).select('username full_name avatar_url');
    
    const hostMap = hosts.reduce((acc, host) => {
      acc[host._id] = host;
      return acc;
    }, {});
    
    // Fetch RSVPs for current user if authenticated
    let userRsvps = [];
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const rsvps = await LearningSessionParticipant.find({ user_id: decoded.id }).select('session_id');
        userRsvps = rsvps.map(r => r.session_id.toString());
      } catch (err) {
        // ignore auth error for public listing
      }
    }
    
    const enriched = sessions.map(s => {
      const sObj = s.toObject();
      sObj.host_profile = hostMap[s.host_id] || null;
      sObj.is_rsvped = userRsvps.includes(s._id.toString());
      return sObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// RSVP to session
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const session = await LearningSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    if (session.participant_count >= session.max_participants) {
      return res.status(400).json({ message: 'Session is full' });
    }
    
    const rsvp = new LearningSessionParticipant({
      session_id: session._id,
      user_id: req.user.id
    });
    
    await rsvp.save();
    
    session.participant_count += 1;
    await session.save();
    
    if (req.io) {
      req.io.emit('learning-sessions-public', { action: 'rsvp', session_id: session._id });
    }
    
    res.status(201).json({ message: 'RSVP successful' });
  } catch (error) {
    if (error.code === 11000) { // duplicate key
      return res.status(400).json({ message: 'Already RSVPed' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel RSVP
router.delete('/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const deleted = await LearningSessionParticipant.findOneAndDelete({
      session_id: req.params.id,
      user_id: req.user.id
    });
    
    if (deleted) {
      await LearningSession.findByIdAndUpdate(req.params.id, { $inc: { participant_count: -1 } });
      
      if (req.io) {
        req.io.emit('learning-sessions-public', { action: 'cancel_rsvp', session_id: req.params.id });
      }
    }
    
    res.json({ message: 'RSVP cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
