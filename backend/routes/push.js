const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const authMiddleware = require('../middleware/authMiddleware');

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBtc3sOEz0y5ZlX5O4iL-sMjk';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'mQzK263z4HryB1n1K8j9-V2pWw1vW5yR9rA2bU1bU8M';
webpush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);

// @route   POST /api/push/subscribe
// @desc    Subscribe user to web push
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const subscription = req.body;
    
    // Check if subscription exists
    let existingSub = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existingSub) {
      if (existingSub.userId.toString() !== req.user.id) {
        existingSub.userId = req.user.id;
        await existingSub.save();
      }
      return res.status(200).json({ success: true, message: 'Subscription already exists' });
    }

    const newSub = new PushSubscription({
      userId: req.user.id,
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });
    await newSub.save();
    
    res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error subscribing to push' });
  }
});

// @route   POST /api/push/unsubscribe
// @desc    Unsubscribe user from web push
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ userId: req.user.id, endpoint });
    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error unsubscribing from push' });
  }
});

// @route   POST /api/push/test
// @desc    Test send push notification
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({ userId: req.user.id });
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test web push notification!',
      icon: '/vite.svg',
      data: { url: '/' }
    });

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      ).catch(async err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      })
    );

    await Promise.all(sendPromises);
    res.status(200).json({ success: true, message: 'Test notification sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending push notification' });
  }
});

module.exports = router;
