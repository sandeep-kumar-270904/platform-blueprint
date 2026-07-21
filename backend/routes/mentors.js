const express = require('express');
const router = express.Router();
const MentorProfile = require('../models/MentorProfile');
const MentorAvailability = require('../models/MentorAvailability');
const MentorBooking = require('../models/MentorBooking');
const MentorReview = require('../models/MentorReview');
const { AMASession } = require('../models/AMA');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const moment = require('moment-timezone');
const rateLimit = require('express-rate-limit');

// Rate Limiters
// Booking attempts: 10 per hour per user
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Too many booking attempts. Please try again later.' }
});

// Search & API access: 100 per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Slow down.' }
});

// Mentor application: 3 per day
const applyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many application attempts today.' }
});

// Review limit: 5 per hour
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many reviews submitted.' }
});

// Apply apiLimiter generally to get routes
router.use('/', apiLimiter);

// ==========================================
// 1. PUBLIC MENTOR LISTING & BROWSE
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { search, expertise, isFree, minRating, maxPrice, page = 1, limit = 10, sort = 'rating', verifiedOnly } = req.query;
    
    // Only show approved, active mentors
    const query = { verificationStatus: 'approved', isActive: true };

    if (verifiedOnly === 'true') {
      query.verificationTier = { $in: ['email_verified', 'institution_verified', 'identity_verified'] };
    }

    if (expertise) {
      query.expertise = { $in: expertise.split(',') };
    }

    if (isFree === 'true') {
      query.pricePerHour = 0;
    } else if (isFree === 'false') {
      query.pricePerHour = { $gt: 0 };
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (maxPrice) {
      query.pricePerHour = { $lte: Number(maxPrice) };
    }

    let sortObj = { rating: -1 };
    if (sort === 'sessions') sortObj = { totalSessions: -1 };
    if (sort === 'price_asc') sortObj = { pricePerHour: 1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };

    const mentors = await MentorProfile.find(query)
      .populate('user_id', 'full_name username avatar_url bio')
      .lean();

    // Filter out incomplete mentors (Onboarding Completion Gate) and apply search
    const validMentors = mentors.filter(m => {
      if (!isMentorBookingReady(m)) return false;
      if (search) {
        const searchTerm = search.toLowerCase();
        const name = (m.user_id?.full_name || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        const company = (m.company || '').toLowerCase();
        return name.includes(searchTerm) || title.includes(searchTerm) || company.includes(searchTerm);
      }
      return true;
    });

    const total = validMentors.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedMentors = validMentors.slice(startIndex, startIndex + Number(limit));

    const formatted = paginatedMentors.map(m => ({
      ...m,
      profile: m.user_id,
      user_id: m.user_id._id
    }));

    res.json({
      mentors: formatted,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET unique expertise tags from approved mentors
router.get('/tags', async (req, res) => {
  try {
    const tags = await MentorProfile.distinct('expertise', { verificationStatus: 'approved', isActive: true });
    res.json(tags.filter(t => t));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/mentors/recommendations - Personalized mentor matching
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const interests = user.interestTags || [];
    const myBlockedIds = user.blockedUsers || [];

    // Find mentors that have matching expertise, are approved and active
    let query = { 
      verificationStatus: 'approved', 
      isActive: true,
      user_id: { $nin: myBlockedIds }
    };
    
    if (interests.length > 0) {
      query.expertise = { $in: interests };
    }

    // Rank by rating and totalSessions
    const mentors = await MentorProfile.find(query)
      .sort({ rating: -1, totalSessions: -1 })
      .limit(10) // fetch a bit more in case we filter out some below
      .populate('user_id', 'full_name username avatar_url blockedUsers')
      .lean();
      
    // Filter mentors who have blocked the current user and are booking-ready
    let validMentors = mentors.filter(m => {
      if (!isMentorBookingReady(m)) return false;
      const mentorUser = m.user_id;
      if (!mentorUser) return false;
      const theirBlockedIds = mentorUser.blockedUsers?.map(id => id.toString()) || [];
      return !theirBlockedIds.includes(req.user.id);
    }).slice(0, 5);

    // If we didn't find any by interest, just return top rated
    if (validMentors.length === 0) {
      const backupMentors = await MentorProfile.find({ 
        verificationStatus: 'approved', 
        isActive: true,
        user_id: { $nin: myBlockedIds }
      })
        .sort({ rating: -1, totalSessions: -1 })
        .limit(20)
        .populate('user_id', 'full_name username avatar_url blockedUsers bio')
        .lean();
        
      validMentors = backupMentors.filter(m => {
        if (!isMentorBookingReady(m)) return false;
        const mentorUser = m.user_id;
        if (!mentorUser) return false;
        const theirBlockedIds = mentorUser.blockedUsers?.map(id => id.toString()) || [];
        return !theirBlockedIds.includes(req.user.id);
      }).slice(0, 5);
    }

    const formatted = validMentors.map(m => {
      const profile = { ...m.user_id };
      delete profile.blockedUsers;
      return {
        ...m,
        profile,
        user_id: m.user_id._id
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET single mentor profile by ID
router.get('/:id', async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id)
      .populate('user_id', 'full_name username avatar_url bio')
      .lean();

    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    
    if (mentor.verificationStatus !== 'approved' || !mentor.isActive) {
      return res.status(403).json({ message: 'Mentor profile is not available' });
    }
    
    res.json({
      ...mentor,
      profile: mentor.user_id,
      user_id: mentor.user_id._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==========================================
// 2. MENTOR APPLICATION & PROFILE MANAGEMENT
// ==========================================
router.post('/apply', authMiddleware, applyLimiter, async (req, res) => {
  try {
    const existing = await MentorProfile.findOne({ user_id: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied to be a mentor.' });
    }

    const { title, company, bio, expertise, yearsOfExperience, languages, pricePerHour, currency, sessionTypes, socialLinks, availabilityRules } = req.body;

    const mentor = new MentorProfile({
      user_id: req.user.id,
      title,
      company,
      bio,
      expertise,
      yearsOfExperience,
      languages,
      pricePerHour,
      currency,
      sessionTypes,
      socialLinks,
      availabilityRules,
      verificationStatus: 'pending',
      isActive: true
    });

    await mentor.save();
    res.status(201).json({ message: 'Application submitted successfully', mentor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const mentor = await MentorProfile.findOne({ user_id: req.user.id });
    if (!mentor) return res.status(404).json({ message: 'Mentor profile not found' });

    const { title, company, bio, expertise, yearsOfExperience, languages, pricePerHour, sessionTypes, socialLinks, availabilityRules, isActive } = req.body;

    // Check if sensitive fields changed that require re-approval
    let needsReapproval = false;
    if (pricePerHour !== undefined && pricePerHour !== mentor.pricePerHour) needsReapproval = true;
    if (expertise !== undefined && JSON.stringify(expertise) !== JSON.stringify(mentor.expertise)) needsReapproval = true;

    if (title !== undefined) mentor.title = title;
    if (company !== undefined) mentor.company = company;
    if (bio !== undefined) mentor.bio = bio;
    if (expertise !== undefined) mentor.expertise = expertise;
    if (yearsOfExperience !== undefined) mentor.yearsOfExperience = yearsOfExperience;
    if (languages !== undefined) mentor.languages = languages;
    if (pricePerHour !== undefined) mentor.pricePerHour = pricePerHour;
    if (sessionTypes !== undefined) mentor.sessionTypes = sessionTypes;
    if (socialLinks !== undefined) mentor.socialLinks = socialLinks;
    if (availabilityRules !== undefined) mentor.availabilityRules = availabilityRules;
    if (isActive !== undefined) mentor.isActive = isActive;

    if (needsReapproval) {
      mentor.verificationStatus = 'pending';
    }

    await mentor.save();
    res.json({ message: 'Profile updated', mentor, reapprovalRequired: needsReapproval });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me/profile', authMiddleware, async (req, res) => {
  try {
    const mentor = await MentorProfile.findOne({ user_id: req.user.id }).lean();
    if (!mentor) return res.status(404).json({ message: 'No mentor profile found' });
    res.json(mentor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==========================================
// 3. AVAILABILITY & BOOKING
// ==========================================
// We'll use a dynamic computation approach for availability.
router.get('/:id/availability', async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const slots = [];
    const now = new Date();
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Find all bookings for this mentor from now onwards
    const bookings = await MentorBooking.find({ 
      mentorId: mentor._id,
      scheduledAt: { $gte: now },
      status: { $in: ['requested', 'confirmed'] }
    }).select('scheduledAt durationMinutes').lean();

    const bookedTimes = bookings.map(b => b.scheduledAt.toISOString());
    
    // Fetch external calendar busy blocks (if connected)
    const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const calendarService = require('../services/calendarService');
    const busyBlocks = await calendarService.getBusyBlocks(mentor.user_id, now, timeMax);

    const mentorTz = mentor.timezone || 'UTC';

    for (let i = 1; i <= 14; i++) {
      const targetMoment = moment.tz(now, mentorTz).add(i, 'days').startOf('day');
      const dayName = targetMoment.format('dddd');

      const isBlackout = mentor.availabilityRules?.blackoutDates?.some(bd => {
        return moment.tz(bd, mentorTz).format('YYYY-MM-DD') === targetMoment.format('YYYY-MM-DD');
      });

      if (isBlackout) continue;

      const dayRules = mentor.availabilityRules?.weekly?.filter(r => r.day === dayName) || [];
      
      dayRules.forEach(rule => {
        if(!rule.startTime || !rule.endTime) return;
        
        let [sh, sm] = rule.startTime.split(':').map(Number);
        let [eh, em] = rule.endTime.split(':').map(Number);
        
        for (let h = sh; h < eh; h++) {
          const slotMoment = targetMoment.clone().hour(h).minute(sm).second(0).millisecond(0);
          if (slotMoment.valueOf() <= now.getTime()) continue;
          
          const slotTime = slotMoment.toDate(); // native Date in UTC
          const slotEnd = new Date(slotTime.getTime() + 60 * 60 * 1000);
          
          // Check internal bookings
          let isBooked = bookedTimes.includes(slotTime.toISOString());
          
          // Check external calendar busy blocks
          if (!isBooked) {
            isBooked = busyBlocks.some(block => {
              const blockStart = new Date(block.start);
              const blockEnd = new Date(block.end);
              return (slotTime < blockEnd && slotEnd > blockStart);
            });
          }
          
          slots.push({
            id: slotTime.toISOString(),
            starts_at: slotTime.toISOString(),
            is_booked: isBooked
          });
        }
      });
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/bookings', authMiddleware, bookingLimiter, async (req, res) => {
  try {
    const { mentorId, scheduledAt, menteeNotes } = req.body;
    
    const mentor = await MentorProfile.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    if (mentor.verificationStatus !== 'approved' || !mentor.isActive) {
      return res.status(400).json({ message: 'Mentor is not available for booking' });
    }

    const slotDate = new Date(scheduledAt);
    if (slotDate <= new Date()) {
      return res.status(400).json({ message: 'Cannot book in the past' });
    }

    // Check for overlapping bookings for the mentee
    const menteeBookings = await MentorBooking.find({
      menteeId: req.user.id,
      status: { $in: ['requested', 'confirmed'] },
      scheduledAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // past 24h just in case
    }).lean();
    
    const hasOverlap = menteeBookings.some(b => {
      const bStart = new Date(b.scheduledAt).getTime();
      const bEnd = bStart + (b.durationMinutes || 60) * 60000;
      const targetStart = slotDate.getTime();
      const targetEnd = targetStart + 60 * 60000; // Assuming 60 min session
      return (targetStart < bEnd && targetEnd > bStart);
    });

    if (hasOverlap) {
      return res.status(409).json({ message: 'You already have a booked session that overlaps with this time slot.' });
    }

    let checkoutUrl = null;
    let stripeSessionId = null;
    let paymentExpiresAt = null;

    let finalPrice = mentor.pricePerHour;
    const menteeUser = await User.findById(req.user.id);
    if (menteeUser && menteeUser.subscriptionTier) {
      if (menteeUser.subscriptionTier === 'pro') {
        finalPrice = finalPrice * 0.85; // 15% off
      } else if (menteeUser.subscriptionTier === 'plus') {
        finalPrice = finalPrice * 0.95; // 5% off
      }
    }

    if (finalPrice > 0) {
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Mentorship Session with ${mentor.title}`,
              description: `1-on-1 session on ${slotDate.toLocaleString()}`
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/mentee?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentors/${mentorId}?payment=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // Stripe minimum is 30 minutes
      });
      
      checkoutUrl = session.url;
      stripeSessionId = session.id;
      paymentExpiresAt = new Date(Date.now() + 15 * 60000); // 15 minute local hold
    }

    const booking = new MentorBooking({
      mentorId,
      menteeId: req.user.id,
      scheduledAt: slotDate,
      durationMinutes: 60,
      menteeNotes,
      status: finalPrice > 0 ? 'requested' : 'confirmed',
      sessionType: '1-on-1',
      pricePaid: finalPrice,
      paymentStatus: finalPrice > 0 ? 'pending' : 'paid',
      stripeSessionId,
      paymentExpiresAt,
      meetingLink: mentor.pricePerHour === 0 ? `https://meet.studenthub.com/${new mongoose.Types.ObjectId()}` : null
    });

    await booking.save();

    // Log the booking activity for streaks/dashboard
    await UserActivity.create({
      user_id: req.user.id,
      action_type: 'mock_interview_book',
      target_id: booking._id
    });

    try {
      // Provision Daily room if confirmed immediately (free session)
      if (booking.status === 'confirmed') {
        const room = await require('../services/videoService').createRoom(booking._id, slotDate, 60);
        booking.dailyRoomId = room.name; // Daily.co uses 'name' as the unique identifier
        booking.dailyRoomUrl = room.url;
        
        // Sync calendar for Mentor
        const eventId = await require('../services/calendarService').createEvent(mentor.user_id, {
          summary: `Mentorship Session with Mentee`,
          description: `1-on-1 session.\nJoin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/video/${booking._id}`,
          startTime: slotDate,
          endTime: new Date(slotDate.getTime() + 60 * 60000)
        });
        if (eventId) booking.calendarEventId = eventId;
      }
      
      // Create notification for mentor
      await notificationService.createNotification({
        userId: mentor.user_id,
        type: 'mentor_booking',
        relatedContentId: booking._id,
        message: mentor.pricePerHour > 0 
          ? `New booking request pending payment for ${slotDate.toLocaleString()}`
          : `New free session booked for ${slotDate.toLocaleString()}`
      });

      if (booking.status === 'confirmed') {
        await notificationService.createNotification({
          userId: req.user.id,
          type: 'placement_booking_status',
          relatedContentId: booking._id,
          message: `Your mock interview with ${mentor.name || 'your mentor'} is confirmed for ${slotDate.toLocaleString()}.`
        });
      }

      // Increment mentor sessions if free and confirmed immediately
      if (booking.status === 'confirmed') {
        mentor.totalSessions += 1;
        await mentor.save();
      }

      if (req.io) {
        req.io.emit('mentor_slots_updated', mentorId);
        req.io.emit(`my_bookings_updated_${req.user.id}`);
        req.io.emit(`mentor_dashboard_updated_${mentor.user_id}`);
      }
      // Convert Waitlist if applicable
      const MentorWaitlist = require('../models/MentorWaitlist');
      await MentorWaitlist.findOneAndUpdate(
        { menteeId: req.user.id, mentorId, status: 'notified' },
        { status: 'converted', convertedBookingId: booking._id }
      );

    } catch (sideErr) {
      console.error('Non-critical side effect failed during booking:', sideErr);
    }

    res.status(201).json({ booking, checkoutUrl });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This slot was just booked by someone else. Please choose another slot.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/bookings/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await MentorBooking.findById(req.params.id).populate('mentorId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Ensure the user is either mentee or mentor
    const isMentee = booking.menteeId.toString() === req.user.id;
    const isMentor = booking.mentorId.user_id.toString() === req.user.id;

    if (!isMentee && !isMentor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    // Refund Logic
    const hoursUntilSession = (new Date(booking.scheduledAt) - new Date()) / (1000 * 60 * 60);
    
    if (isMentee && hoursUntilSession < 4) {
      return res.status(400).json({ message: 'Cancellations are not permitted within 4 hours of the session start time.' });
    }
    
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = isMentee ? 'mentee' : 'mentor';

    if (booking.paymentStatus === 'paid') {
      let shouldRefund = false;
      if (isMentor) {
        shouldRefund = true; // Mentor cancelled, full refund always
      } else if (isMentee && hoursUntilSession > 24) {
        shouldRefund = true; // Mentee cancelled > 24h prior, full refund
      }

      if (shouldRefund) {
        if (booking.stripePaymentIntentId) {
          try {
            await stripe.refunds.create({
              payment_intent: booking.stripePaymentIntentId,
            });
            booking.refundStatus = 'full';
            booking.paymentStatus = 'refunded';
          } catch (refundErr) {
            console.error('Stripe refund failed:', refundErr.message);
            return res.status(500).json({ message: 'Refund failed, contact support' });
          }
        } else {
          // Fallback if no payment intent (e.g. simulated payment)
          booking.refundStatus = 'full';
          booking.paymentStatus = 'refunded';
        }
      } else {
        booking.refundStatus = 'none';
      }
    } else {
      booking.paymentStatus = 'failed';
    }
    
    // Clear expiration holds
    booking.paymentExpiresAt = null;

    await booking.save();

    // Notify the other party about the cancellation
    const targetUserId = isMentee ? booking.mentorId.user_id : booking.menteeId;
    const actorName = isMentee ? 'Mentee' : 'Mentor';
    await notificationService.createNotification({
      userId: targetUserId,
      type: 'placement_booking_status',
      relatedContentId: booking._id,
      message: `Your mock interview was cancelled by the ${actorName}. Reason: ${reason}`
    });

    // Notify waitlist atomically
    try {
      const MentorWaitlist = require('../models/MentorWaitlist');
      const waitlistEntry = await MentorWaitlist.findOneAndUpdate(
        { mentorId: booking.mentorId._id, status: 'waiting' },
        { 
          status: 'notified', 
          notifiedAt: new Date(), 
          claimExpiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour to claim
        },
        { sort: { createdAt: 1 }, new: true }
      );

      if (waitlistEntry) {
        await notificationService.createNotification({
          userId: waitlistEntry.menteeId,
          type: 'mentor_waitlist_open',
          relatedContentId: booking.mentorId._id,
          message: `A spot has opened up for ${booking.mentorId.title || 'your mentor'}! You have 1 hour to claim it.`
        });
      }
    } catch (e) {
      console.error('Failed to process waitlist on cancel:', e);
    }

    if (req.io) {
      req.io.emit('mentor_slots_updated', booking.mentorId._id);
      req.io.emit(`my_bookings_updated_${booking.menteeId}`);
      req.io.emit(`mentor_dashboard_updated_${booking.mentorId.user_id}`);
    }

    res.json({ message: 'Booking cancelled successfully', refundStatus: booking.refundStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/bookings/:id/reschedule', authMiddleware, async (req, res) => {
  try {
    const { newDate, reason } = req.body;
    const booking = await MentorBooking.findById(req.params.id).populate('mentorId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isMentee = booking.menteeId.toString() === req.user.id;
    const isMentor = booking.mentorId.user_id.toString() === req.user.id;

    if (!isMentee && !isMentor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot reschedule a ${booking.status} booking` });
    }

    const hoursUntilSession = (new Date(booking.scheduledAt) - new Date()) / (1000 * 60 * 60);
    if (isMentee && hoursUntilSession < 4) {
      return res.status(400).json({ message: 'Rescheduling is not permitted within 4 hours of the session start time.' });
    }

    const slotDate = new Date(newDate);
    if (slotDate <= new Date()) {
      return res.status(400).json({ message: 'Cannot reschedule to a past date' });
    }

    // Note: A robust state machine would put it in a 'reschedule_proposed' state 
    // and wait for the other party to accept. For simplicity in this iteration, 
    // we assume the change is accepted immediately and the old slot is freed.
    
    booking.rescheduleHistory.push({
      previousDate: booking.scheduledAt,
      rescheduledBy: isMentee ? 'mentee' : 'mentor',
      reason,
      rescheduledAt: new Date()
    });

    booking.scheduledAt = slotDate;

    // Notify the other party about the reschedule
    const targetUserId = isMentee ? booking.mentorId.user_id : booking.menteeId;
    const actorName = isMentee ? 'Mentee' : 'Mentor';
    await notificationService.createNotification({
      userId: targetUserId,
      type: 'placement_booking_status',
      relatedContentId: booking._id,
      message: `Your mock interview was rescheduled by the ${actorName} to ${slotDate.toLocaleString()}. Reason: ${reason || 'None provided'}`
    });
    await booking.save();

    if (req.io) {
      req.io.emit('mentor_slots_updated', booking.mentorId._id);
      req.io.emit(`my_bookings_updated_${booking.menteeId}`);
      req.io.emit(`mentor_dashboard_updated_${booking.mentorId.user_id}`);
    }

    res.json({ message: 'Booking rescheduled successfully', booking });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'The requested slot is already booked.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/mentors/bookings/me
router.get('/bookings/me', authMiddleware, async (req, res) => {
  try {
    const bookings = await MentorBooking.find({ menteeId: req.user.id })
      .populate({
        path: 'mentorId',
        populate: { path: 'user_id', select: 'full_name username avatar_url' }
      })
      .sort({ scheduledAt: 1 })
      .lean();

    const formatted = bookings.map(b => ({
      ...b,
      mentor: b.mentorId ? { title: b.mentorId.title, company: b.mentorId.company } : null,
      mentor_profile: b.mentorId && b.mentorId.user_id ? b.mentorId.user_id : null
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/mentors/dashboard/sessions - For mentors
router.get('/dashboard/sessions', authMiddleware, async (req, res) => {
  try {
    const mentor = await MentorProfile.findOne({ user_id: req.user.id });
    if (!mentor) return res.status(404).json({ message: 'Mentor profile not found' });

    const bookings = await MentorBooking.find({ mentorId: mentor._id })
      .populate('menteeId', 'full_name username avatar_url')
      .sort({ scheduledAt: -1 })
      .lean();

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/mentors/analytics - Mentor Analytics Dashboard
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const mentor = await MentorProfile.findOne({ user_id: req.user.id });
    if (!mentor) return res.status(404).json({ message: 'Mentor profile not found' });

    const bookings = await MentorBooking.find({ mentorId: mentor._id }).lean();
    
    // Calculate metrics
    const totalEarnings = bookings
      .filter(b => b.paymentStatus === 'paid' && b.status === 'completed')
      .reduce((sum, b) => sum + (b.chargedAmount || b.pricePaid), 0);
      
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const noShows = bookings.filter(b => b.status === 'no-show').length;
    const noShowRate = totalBookings > 0 ? (noShows / totalBookings) * 100 : 0;
    
    // Group by month for chart
    const sessionsByMonth = {};
    bookings.forEach(b => {
      const month = new Date(b.scheduledAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      sessionsByMonth[month] = (sessionsByMonth[month] || 0) + 1;
    });

    res.json({
      totalEarnings,
      totalBookings,
      completedBookings,
      noShowRate,
      rating: mentor.rating,
      reviewsCount: mentor.reviewsCount,
      sessionsByMonth: Object.keys(sessionsByMonth).map(k => ({ month: k, count: sessionsByMonth[k] }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching analytics', error: err.message });
  }
});

// Webhooks removed: Moved to /routes/webhooks.js

// ==========================================
// 6. REVIEWS
// ==========================================
router.post('/bookings/:id/review', authMiddleware, reviewLimiter, async (req, res) => {
  try {
    const { rating, writtenFeedback } = req.body;
    const booking = await MentorBooking.findById(req.params.id).populate('mentorId');
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.menteeId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed sessions' });

    const existing = await MentorReview.findOne({ bookingId: booking._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this session' });

    const review = new MentorReview({
      bookingId: booking._id,
      menteeId: req.user.id,
      mentorId: booking.mentorId._id,
      rating,
      writtenFeedback
    });

    await review.save();

    // Recalculate mentor rating
    const mentor = booking.mentorId;
    const newCount = mentor.reviewsCount + 1;
    const newRating = ((mentor.rating * mentor.reviewsCount) + Number(rating)) / newCount;
    
    mentor.rating = newRating;
    mentor.reviewsCount = newCount;
    await mentor.save();

    await notificationService.createNotification({
      userId: mentor.user_id,
      type: 'mentor_review',
      relatedContentId: review._id,
      message: `You received a ${rating}-star review for a recent session!`
    });
    
    // Evaluate badges and tiers asynchronously
    require('../services/badgeService').evaluateMentorBadges(mentor._id);

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reviewed this session' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Edit Review
router.put('/bookings/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, writtenFeedback } = req.body;
    const booking = await MentorBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.menteeId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const review = await MentorReview.findOne({ bookingId: booking._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Enforce 48 hour edit window
    const hoursSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 48) {
      return res.status(400).json({ message: 'Reviews cannot be edited after 48 hours' });
    }

    const oldRating = review.rating;
    review.rating = rating;
    review.writtenFeedback = writtenFeedback;
    review.editedAt = new Date();
    await review.save();

    // Recalculate mentor rating
    if (oldRating !== rating) {
      const mentor = await MentorProfile.findById(booking.mentorId);
      // Remove old rating contribution and add new
      const currentTotal = mentor.rating * mentor.reviewsCount;
      const newTotal = currentTotal - oldRating + rating;
      mentor.rating = newTotal / mentor.reviewsCount;
      await mentor.save();
    }

    res.json({ message: 'Review updated', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Mentor Reply
router.post('/bookings/:id/review/reply', authMiddleware, async (req, res) => {
  try {
    const { reply } = req.body;
    const booking = await MentorBooking.findById(req.params.id).populate('mentorId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (booking.mentorId.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const review = await MentorReview.findOne({ bookingId: booking._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    if (review.mentorReply) {
      return res.status(400).json({ message: 'You have already replied to this review' });
    }

    review.mentorReply = reply;
    await review.save();

    res.json({ message: 'Reply posted', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Flag Review
router.post('/reviews/:id/flag', authMiddleware, async (req, res) => {
  try {
    const review = await MentorReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Just mark as flagged for moderation. Admin will review it.
    if (review.moderationStatus === 'public') {
      review.moderationStatus = 'flagged';
      await review.save();
    }

    res.json({ message: 'Review flagged for moderation' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await MentorReview.find({ mentorId: req.params.id, moderationStatus: 'public' })
      .populate('menteeId', 'full_name username avatar_url')
      .sort({ createdAt: -1 })
      .lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==========================================
// 7. WAITLIST
// ==========================================
router.post('/:id/notify-availability', authMiddleware, async (req, res) => {
  try {
    const MentorWaitlist = require('../models/MentorWaitlist');
    
    const existing = await MentorWaitlist.findOne({ 
      mentorId: req.params.id, 
      menteeId: req.user.id, 
      status: { $in: ['waiting', 'notified'] } 
    });

    if (existing) {
      return res.status(400).json({ message: 'You are already on the alert list for this mentor.' });
    }

    const waitlist = new MentorWaitlist({
      mentorId: req.params.id,
      menteeId: req.user.id,
      anyAvailability: true,
      status: 'waiting'
    });

    await waitlist.save();
    res.status(201).json({ message: 'You will be notified when the mentor has new availability.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/waitlist', authMiddleware, async (req, res) => {
  try {
    const MentorWaitlist = require('../models/MentorWaitlist');
    const { preferredStartTime, preferredEndTime, anyAvailability } = req.body;
    
    const existing = await MentorWaitlist.findOne({ 
      mentorId: req.params.id, 
      menteeId: req.user.id, 
      status: { $in: ['waiting', 'notified'] } 
    });

    if (existing) {
      return res.status(400).json({ message: 'You are already on the waitlist for this mentor.' });
    }

    const waitlist = new MentorWaitlist({
      mentorId: req.params.id,
      menteeId: req.user.id,
      preferredStartTime,
      preferredEndTime,
      anyAvailability: anyAvailability !== undefined ? anyAvailability : true
    });

    await waitlist.save();
    res.status(201).json({ message: 'Joined waitlist successfully', waitlist });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
