const express = require('express');
const router = express.Router();
const MentorBooking = require('../models/MentorBooking');
const PayoutTracking = require('../models/PayoutTracking');
const MentorProfile = require('../models/MentorProfile');
const notificationService = require('../services/notificationService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock'); // fallback if no key provided

// This needs to be raw body for signature verification!
// So it must be mounted BEFORE express.json() in server.js
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // If a real webhook secret exists, verify signature. Otherwise, mock verification for testing.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Development fallback (simulate event)
    try {
      event = JSON.parse(req.body);
    } catch (e) {
      return res.status(400).send('Invalid JSON');
    }
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Find booking by stripeSessionId
        const booking = await MentorBooking.findOne({ stripeSessionId: session.id });
        if (!booking) {
          console.error(`Booking not found for session ${session.id}`);
          break;
        }

        // Idempotency check: only confirm if pending
        if (booking.status === 'requested' && booking.paymentStatus === 'pending') {
          booking.status = 'confirmed';
          booking.paymentStatus = 'paid';
          booking.pricePaid = session.amount_total ? (session.amount_total / 100) : booking.pricePaid;
          booking.stripePaymentIntentId = session.payment_intent;
          booking.paymentExpiresAt = null; // Clear expiration hold
          
          // Generate dummy meeting link (Legacy)
          booking.meetingLink = `https://meet.studenthub.com/${booking._id}`;
          
          try {
            const room = await require('../services/videoService').createRoom(booking._id, booking.scheduledAt, 60);
            booking.dailyRoomId = room.name;
            booking.dailyRoomUrl = room.url;
          } catch (e) {
            console.error('Failed to provision Daily room in webhook:', e);
          }
          
          await booking.save();

          // Payout Ledger tracking
          const mentorProfile = await MentorProfile.findById(booking.mentorId).populate('user_id');
          if (mentorProfile) {
            const platformFee = booking.pricePaid * 0.10; // 10% fee
            await PayoutTracking.create({
              mentorId: mentorProfile._id,
              bookingId: booking._id,
              amount: booking.pricePaid - platformFee,
              platformFee: platformFee,
              currency: 'USD',
              status: 'pending'
            });

            // Notify mentor
            await notificationService.createNotification({
              userId: mentorProfile.user_id._id,
              type: 'booking_confirmed',
              relatedContentId: booking._id,
              message: `You have a new paid session booked!`
            });
          }

          // Notify mentee
          await notificationService.createNotification({
            userId: booking.menteeId,
            type: 'booking_confirmed',
            relatedContentId: booking._id,
            message: `Payment successful! Your session is confirmed.`
          });
        }
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object;
        const booking = await MentorBooking.findOne({ stripeSessionId: session.id });
        
        // Release slot if expired and not paid
        if (booking && booking.paymentStatus === 'pending') {
          booking.status = 'cancelled';
          booking.paymentStatus = 'failed';
          booking.cancellationReason = 'Payment expired';
          booking.cancelledBy = 'system';
          booking.paymentExpiresAt = null;
          await booking.save();
        }
        break;
      }
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==========================================
// 2. DAILY.CO WEBHOOKS
// ==========================================
router.post('/daily', async (req, res) => {
  try {
    const event = req.body;
    
    if (event.type === 'recording.ready-to-download') {
      const roomName = event.payload.room_name;
      const downloadLink = event.payload.download_link;

      const aiService = require('../services/aiService');
      const MentorBooking = require('../models/MentorBooking');
      const { AMASession } = require('../models/AMA');

      let booking = await MentorBooking.findOne({ dailyRoomId: roomName });
      if (booking) {
        booking.recordingUrl = downloadLink;
        await booking.save();
        await aiService.processRecording(booking._id, downloadLink, 'booking');
        return res.json({ received: true });
      }

      let ama = await AMASession.findOne({ daily_room_id: roomName });
      if (ama) {
        ama.recording_url = downloadLink;
        await ama.save();
        await aiService.processRecording(ama._id, downloadLink, 'ama');
        return res.json({ received: true });
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Daily webhook error:', err);
    res.status(500).send('Webhook Error');
  }
});

// ==========================================
// 3. ASSEMBLYAI WEBHOOKS
// ==========================================
router.post('/assemblyai', async (req, res) => {
  try {
    const { transcript_id, status } = req.body;
    
    if (status === 'completed') {
      const aiService = require('../services/aiService');
      const axios = require('axios');
      
      const apiKey = process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey) return res.json({ received: true });
      
      const response = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcript_id}`, {
        headers: { authorization: apiKey }
      });
      
      const { text, summary, chapters } = response.data;
      await aiService.handleWebhook(transcript_id, status, summary, text, chapters);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('AssemblyAI webhook error:', err);
    res.status(500).send('Webhook Error');
  }
});

module.exports = router;
