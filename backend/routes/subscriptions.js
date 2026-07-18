const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Create a simulated checkout session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!['free', 'plus', 'pro'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    // Since we are mocking Stripe, we'll just immediately upgrade the user's tier
    // In a real application, you would create a Stripe Checkout session and return the URL.
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.subscriptionTier = tier;
    await user.save();

    res.json({ 
      success: true, 
      message: `Successfully upgraded to ${tier.toUpperCase()} tier!`,
      url: `/dashboard` // Mock redirect URL
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current subscription status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      subscriptionTier: user.subscriptionTier || 'free'
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
