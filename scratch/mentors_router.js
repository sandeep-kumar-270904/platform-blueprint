const express = require('express');
const router = express.Router();
const MentorProfile = require('../models/MentorProfile');
const MentorAvailability = require('../models/MentorAvailability');
const MentorBooking = require('../models/MentorBooking');
const MentorReview = require('../models/MentorReview');
const AMASession = require('../models/AMASession');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

// ==========================================
// 1. PUBLIC MENTOR LISTING & BROWSE
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { search, expertise, isFree, minRating, page = 1, limit = 20, sort = 'rating' } = req.query;
    
    // Only show approved, active mentors
    const query = { verificationStatus: 'approved', isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
      // We will also match User name in memory or we can lookup, but for now we regex title/company.
    }

    if (expertise) {
      // expertise can be a comma-separated list
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

    let sortObj = { rating: -1 };
    if (sort === 'sessions') sortObj = { totalSessions: -1 };
    if (sort === 'price_asc') sortObj = { pricePerHour: 1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const mentors = await MentorProfile.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('user_id', 'full_name username avatar_url')
      .lean();

    const total = await MentorProfile.countDocuments(query);

    // Format output to match frontend expectations
    const formatted = mentors.map(m => ({
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

// GET single mentor profile by ID
router.get('/:id', async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id)
      .populate('user_id', 'full_name username avatar_url bio')
      .lean();

    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    
    // Only allow public viewing if approved (or if the user themselves is viewing it)
    // We'll just return it and let frontend handle if they are the owner
    
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
router.post('/apply', authMiddleware, async (req, res) => {
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

    // Generate slots for the next 30 days based on availabilityRules
    const slots = [];
    const now = new Date();
    // For now, we will just return some mock dynamic slots for the next 7 days 
    // based on their weekly rules. 
    // A robust implementation would iterate days, check rules, and subtract bookings.

    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Find all bookings for this mentor from now onwards
    const bookings = await MentorBooking.find({ 
      mentorId: mentor._id,
      scheduledAt: { $gte: now },
      status: { $in: ['requested', 'confirmed'] }
    }).select('scheduledAt durationMinutes').lean();

    const bookedTimes = bookings.map(b => b.scheduledAt.toISOString());

    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      date.setHours(0,0,0,0);

      const dayName = daysMap[date.getDay()];
      
      // Check if blackout date
      const isBlackout = mentor.availabilityRules?.blackoutDates?.some(bd => {
        const bdate = new Date(bd);
        return bdate.toDateString() === date.toDateString();
      });

      if (isBlackout) continue;

      // Find rules for this day
      const dayRules = mentor.availabilityRules?.weekly?.filter(r => r.day === dayName) || [];
      
      // Generate slots for each rule
      dayRules.forEach(rule => {
        if(!rule.startTime || !rule.endTime) return;
        
        let [sh, sm] = rule.startTime.split(':').map(Number);
        let [eh, em] = rule.endTime.split(':').map(Number);
        
        // simple 1-hour intervals
        for (let h = sh; h < eh; h++) {
          const slotTime = new Date(date);
          slotTime.setHours(h, sm, 0, 0);
          
          if (slotTime <= now) continue;
          
          const isBooked = bookedTimes.includes(slotTime.toISOString());
          
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

router.post('/bookings', authMiddleware, async (req, res) => {
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

    // Check race condition using DB unique index mentorId_scheduledAt
    // It will throw a MongoError 11000 if someone else booked it
    const booking = new MentorBooking({
      mentorId,
      menteeId: req.user.id,
      scheduledAt: slotDate,
      durationMinutes: 60,
      menteeNotes,
      status: mentor.pricePerHour > 0 ? 'requested' : 'confirmed',
      sessionType: '1-on-1',
      pricePaid: mentor.pricePerHour,
      paymentStatus: mentor.pricePerHour > 0 ? 'pending' : 'paid',
      meetingLink: mentor.pricePerHour === 0 ? `https://meet.studenthub.com/${new mongoose.Types.ObjectId()}` : null
    });

    await booking.save();

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

    res.status(201).json(booking);
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

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    await booking.save();

    if (req.io) {
      req.io.emit('mentor_slots_updated', booking.mentorId._id);
      req.io.emit(`my_bookings_updated_${booking.menteeId}`);
      req.io.emit(`mentor_dashboard_updated_${booking.mentorId.user_id}`);
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
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

// ==========================================
// 4. PAYMENTS & WEBHOOKS (SIMULATED)
// ==========================================
// In a real app, this would receive a payload from Stripe/Razorpay
router.post('/webhook/payment', async (req, res) => {
  try {
    const { bookingId, transactionId, status } = req.body;
    // Idempotency check:
    const booking = await MentorBooking.findById(bookingId).populate('mentorId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.paymentStatus === 'paid') {
      return res.json({ message: 'Already processed' });
    }

    if (status === 'success') {
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      booking.meetingLink = `https://meet.studenthub.com/${new mongoose.Types.ObjectId()}`;
      await booking.save();

      booking.mentorId.totalSessions += 1;
      await booking.mentorId.save();

      // Track payout
      const platformFeePercent = 0.10; // 10%
      const amountEarned = booking.pricePaid * (1 - platformFeePercent);
      const platformFee = booking.pricePaid * platformFeePercent;

      await require('../models/PayoutTracking').create({
        mentorId: booking.mentorId._id,
        bookingId: booking._id,
        amountEarned,
        platformFee,
        payoutStatus: 'pending',
        transactionId
      });

      if (req.io) {
        req.io.emit('mentor_slots_updated', booking.mentorId._id);
        req.io.emit(`my_bookings_updated_${booking.menteeId}`);
        req.io.emit(`mentor_dashboard_updated_${booking.mentorId.user_id}`);
      }
    }

    res.json({ message: 'Webhook processed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==========================================
// 5. AMA SESSIONS
// ==========================================
router.get('/amas', async (req, res) => {
  try {
    const amas = await AMASession.find()
      .populate({
        path: 'hostMentorId',
        populate: { path: 'user_id', select: 'full_name username avatar_url' }
      })
      .sort({ scheduledAt: 1 })
      .lean();
    res.json(amas);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/amas', authMiddleware, async (req, res) => {
  try {
    const mentor = await MentorProfile.findOne({ user_id: req.user.id });
    if (!mentor || mentor.verificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Only approved mentors can create AMAs' });
    }
    
    const { title, description, scheduledAt, maxAttendees, durationMinutes } = req.body;
    const ama = new AMASession({
      hostMentorId: mentor._id,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      maxAttendees
    });
    
    await ama.save();
    res.status(201).json(ama);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/amas/:id/register', authMiddleware, async (req, res) => {
  try {
    const ama = await AMASession.findById(req.params.id);
    if (!ama) return res.status(404).json({ message: 'AMA not found' });
    if (ama.status !== 'upcoming') return res.status(400).json({ message: 'AMA is not upcoming' });
    if (ama.registeredAttendees.includes(req.user.id)) return res.status(400).json({ message: 'Already registered' });
    if (ama.registeredAttendees.length >= ama.maxAttendees) return res.status(400).json({ message: 'AMA is full' });

    // Atomic push to prevent race condition overbooking
    const updated = await AMASession.findOneAndUpdate(
      { _id: ama._id, 'registeredAttendees.length': { $lt: ama.maxAttendees } },
      { $addToSet: { registeredAttendees: req.user.id } },
      { new: true }
    );
    
    if (!updated) {
      return res.status(409).json({ message: 'AMA just filled up. Please try another session.' });
    }

    res.json({ message: 'Registered successfully', ama: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==========================================
// 6. REVIEWS
// ==========================================
router.post('/bookings/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, writtenFeedback } = req.body;
    const booking = await MentorBooking.findById(req.params.id).populate('mentorId');
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.menteeId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    // if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed sessions' });

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

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reviewed this session' });
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

module.exports = router;
