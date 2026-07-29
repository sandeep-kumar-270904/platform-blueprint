const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');

// Generate referral code if user doesn't have one
const ensureReferralCode = async (user) => {
  if (!user.referralCode) {
    user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await user.save();
  }
  return user.referralCode;
};

// Get my platform referral stats
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await ensureReferralCode(user);

    // Count successful referrals (users who used this code)
    const referredUsersCount = await User.countDocuments({ referredBy: user._id });

    res.json({
      referralCode: user.referralCode,
      walletCredit: user.walletCredit || 0,
      referredUsersCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Apply a platform referral code
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Referral code is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.referredBy) {
      return res.status(400).json({ message: 'You have already applied a referral code.' });
    }

    const referrer = await User.findOne({ referralCode: code.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code.' });
    }

    if (referrer._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot use your own referral code.' });
    }

    user.referredBy = referrer._id;
    // Add $10 credit to the new user immediately
    user.walletCredit = (user.walletCredit || 0) + 10; 
    await user.save();

    // Reward the referrer with $10 credit as well
    referrer.walletCredit = (referrer.walletCredit || 0) + 10;
    await referrer.save();

    res.json({ 
      message: 'Referral code applied successfully! $10 added to your wallet.',
      walletCredit: user.walletCredit 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
