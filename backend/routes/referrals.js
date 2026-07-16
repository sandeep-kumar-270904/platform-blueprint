const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Job = require('../models/Job');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { getIO } = require('../socket');

// GET /api/referrals/me - Get referrals made by me or to me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const sent = await Referral.find({ referrer: req.user.id })
      .populate('job', 'title company')
      .populate('referredUser', 'full_name username avatar_url')
      .sort({ createdAt: -1 })
      .lean();
      
    // Find received referrals by matching user ID or email
    const received = await Referral.find({
      $or: [
        { referredUser: req.user.id },
        { referredEmail: userEmail }
      ]
    })
      .populate('job', 'title company')
      .populate('referrer', 'full_name username avatar_url')
      .sort({ createdAt: -1 })
      .lean();
      
    res.json({ sent, received });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
