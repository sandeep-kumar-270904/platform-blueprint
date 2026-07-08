const express = require('express');
const router = express.Router();
const MentorProfile = require('../models/MentorProfile');
const MentorAvailability = require('../models/MentorAvailability');
const MentorBooking = require('../models/MentorBooking');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/mentors
router.get('/', async (req, res) => {
  try {
    const mentors = await MentorProfile.find({ is_active: true })
      .sort({ rating: -1 })
      .lean();

    const userIds = [...new Set(mentors.map(m => m.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const mentorsWithProfiles = mentors.map(m => ({
      ...m,
      profile: userMap[m.user_id.toString()] || null
    }));

    res.json(mentorsWithProfiles);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/mentors/:id/availability
router.get('/:id/availability', async (req, res) => {
  try {
    const slots = await MentorAvailability.find({
      mentor_id: req.params.id,
      starts_at: { $gte: new Date() }
    }).sort({ starts_at: 1 });

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/mentors/bookings/me
router.get('/bookings/me', authMiddleware, async (req, res) => {
  try {
    const bookings = await MentorBooking.find({ mentee_id: req.user.id })
      .sort({ scheduled_at: 1 })
      .lean();

    if (!bookings.length) return res.json([]);

    const mentorIds = [...new Set(bookings.map(b => b.mentor_id.toString()))];
    const mentors = await MentorProfile.find({ _id: { $in: mentorIds } }).lean();
    
    const userIds = [...new Set(mentors.map(m => m.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    
    const mentorMap = mentors.reduce((acc, m) => ({ ...acc, [m._id.toString()]: m }), {});
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const bookingsWithDetails = bookings.map(b => {
      const mentor = mentorMap[b.mentor_id.toString()];
      return {
        ...b,
        mentor: mentor ? { title: mentor.title, company: mentor.company, user_id: mentor.user_id } : null,
        mentor_profile: mentor ? userMap[mentor.user_id.toString()] : null
      };
    });

    res.json(bookingsWithDetails);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/mentors/bookings
// Expects: { slot_id: "...", mentor_id: "..." }
router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const { slot_id, mentor_id } = req.body;
    
    const slot = await MentorAvailability.findById(slot_id);
    if (!slot || slot.is_booked) {
      return res.status(400).json({ message: 'Slot is no longer available' });
    }

    slot.is_booked = true;
    await slot.save();

    const booking = new MentorBooking({
      mentor_id,
      mentee_id: req.user.id,
      scheduled_at: slot.starts_at,
      duration_minutes: 60, // simple default based on slot diff, assuming 60 mins for now
      price_paid: 0,
      status: 'confirmed'
    });
    
    await booking.save();
    
    // Notify the mentor slots channel
    req.io.emit('mentor_slots_updated', mentor_id);
    
    // Notify the mentee's bookings channel
    req.io.emit(`my_bookings_updated_${req.user.id}`);
    
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/mentors/bookings/:id/cancel
router.post('/bookings/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await MentorBooking.findOne({ _id: req.params.id, mentee_id: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    booking.status = 'cancelled';
    await booking.save();
    
    // Free up the slot (simplistic implementation)
    await MentorAvailability.findOneAndUpdate(
      { mentor_id: booking.mentor_id, starts_at: booking.scheduled_at },
      { is_booked: false }
    );
    
    // Notify
    req.io.emit('mentor_slots_updated', booking.mentor_id);
    req.io.emit(`my_bookings_updated_${req.user.id}`);
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
