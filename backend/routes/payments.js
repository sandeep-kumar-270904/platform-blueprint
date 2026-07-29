
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock'); // mock if not exists
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizPurchase = require('../models/QuizPurchase');
const bodyParser = require('body-parser');

// Create checkout session for Subscription
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'StudentHub Premium',
            description: 'Unlimited AI, Analytics, Ad-Free',
          },
          unit_amount: 999, // $9.99
          recurring: { interval: 'month' }
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing?canceled=true`,
      client_reference_id: req.user.id,
      customer_email: user.email
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    // If stripe fails (due to mock key), just mock success for local dev
    res.json({ id: 'mock_session', url: 'http://localhost:3000/billing?success=true&mock=true' });
  }
});

// Mock success endpoint for dev without real stripe webhook
router.post('/mock-success', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id);
    user.isPremium = true;
    user.subscriptionStatus = 'active';
    await user.save();
    res.json({ success: true });
});

// Purchase a single paid quiz
router.post('/purchase-quiz', authMiddleware, async (req, res) => {
  try {
    const { quizId } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.price <= 0) return res.status(400).json({ error: 'Invalid quiz or price' });
    
    // We would normally create a stripe session here with the creator's connected account
    // Application fee amount = 15%
    
    // MOCK FOR DEV: Instantly grant purchase
    const purchase = new QuizPurchase({
       user: req.user.id,
       quiz: quizId,
       stripePaymentIntentId: 'mock_pi_123'
    });
    await purchase.save();
    
    res.json({ success: true, url: `/quizzes/${quizId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
