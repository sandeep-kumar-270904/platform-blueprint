const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Dispute = require('../models/Dispute');
const MentorBooking = require('../models/MentorBooking');

// @route   POST /api/disputes
// @desc    Raise a new dispute
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { bookingId, category, description, evidence } = req.body;
    
    // Verify booking belongs to user
    const booking = await MentorBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.menteeId.toString() !== req.user.id && booking.mentorId.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this booking' });
    }

    const newDispute = new Dispute({
      bookingId,
      raisedBy: req.user.id,
      category,
      description,
      evidence
    });
    await newDispute.save();
    
    res.status(201).json(newDispute);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error raising dispute' });
  }
});

// @route   GET /api/disputes/my-disputes
// @desc    Get current user's disputes
router.get('/my-disputes', authMiddleware, async (req, res) => {
  try {
    const disputes = await Dispute.find({ raisedBy: req.user.id })
      .populate({ path: 'bookingId', populate: { path: 'mentorId', populate: { path: 'user_id', select: 'full_name' } } })
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching disputes' });
  }
});

module.exports = router;
