const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MentorBooking = require('../models/MentorBooking');
const MentorProfile = require('../models/MentorProfile');
const { AMASession } = require('../models/AMA');
const videoService = require('../services/videoService');

// GET /api/video/join/booking/:id
router.get('/join/booking/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await MentorBooking.findById(req.params.id).populate('mentorId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'confirmed') {
      return res.status(403).json({ message: `Cannot join a ${booking.status} session` });
    }

    // Verify identity
    const isMentee = booking.menteeId.toString() === req.user.id;
    const isMentor = booking.mentorId.user_id.toString() === req.user.id;

    if (!isMentee && !isMentor) {
      return res.status(403).json({ message: 'Access denied: not a participant of this session' });
    }

    // Generate secure token
    const token = await videoService.createMeetingToken(
      booking.dailyRoomId, 
      req.user.full_name || 'Participant', 
      isMentor // Only mentor can start recording
    );

    // Record join time
    let updated = false;
    if (isMentee && !booking.menteeJoinedAt) {
      booking.menteeJoinedAt = new Date();
      updated = true;
    }
    if (isMentor && !booking.mentorJoinedAt) {
      booking.mentorJoinedAt = new Date();
      updated = true;
    }
    if (updated) {
      await booking.save();
    }

    res.json({ url: booking.dailyRoomUrl, token });
  } catch (err) {
    console.error('Video Join Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/video/join/ama/:id
router.get('/join/ama/:id', authMiddleware, async (req, res) => {
  try {
    const ama = await AMASession.findById(req.params.id);
    if (!ama) return res.status(404).json({ message: 'AMA not found' });

    if (!['upcoming', 'live'].includes(ama.status)) {
      return res.status(403).json({ message: `Cannot join a ${ama.status} AMA` });
    }

    const isHost = ama.mentor_id.toString() === req.user.id;
    const isAttendee = ama.registered_attendees.some(a => a.user_id.toString() === req.user.id);

    if (!isHost && !isAttendee) {
      return res.status(403).json({ message: 'Access denied: not registered for this AMA' });
    }

    const token = await videoService.createMeetingToken(
      ama.daily_room_id, 
      req.user.full_name || 'Participant', 
      isHost
    );

    res.json({ url: ama.daily_room_url, token });
  } catch (err) {
    console.error('Video Join Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
