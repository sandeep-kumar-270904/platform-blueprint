const SkillOffer = require('../models/SkillOffer');
const SkillMatch = require('../models/SkillMatch');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const SkillSession = require('../models/SkillSession');
const SkillReview = require('../models/SkillReview');
const SkillSwapBadge = require('../models/SkillSwapBadge');
const SkillSwapReport = require('../models/SkillSwapReport');
const SkillEndorsement = require('../models/SkillEndorsement');
const SkillGoal = require('../models/SkillGoal');
const skillStreakService = require('../services/skillStreakService');
const User = require('../models/User');

const { computeMatchesForUser } = require('../services/skillMatchService');
const notificationService = require('../services/notificationService');

exports.createOffer = async (req, res) => {
  try {
    const offer = new SkillOffer({
      ...req.body,
      user: req.user.id
    });
    await offer.save();
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getOffers = async (req, res) => {
  try {
    const { category, search, proficiencyLevel, page = 1, limit = 10 } = req.query;
    const query = { status: 'active' };

    if (category) query.category = category;
    if (proficiencyLevel) query.proficiencyLevel = proficiencyLevel;
    if (search) {
      query.$or = [
        { skillName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const safeLimit = Math.min(Number(limit) || 20, 50);

    const offers = await SkillOffer.find(query)
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    const total = await SkillOffer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: offers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOfferById = async (req, res) => {
  try {
    const offer = await SkillOffer.findById(req.params.id).populate('user', 'name avatar');
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    let offer = await SkillOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    
    if (offer.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this offer' });
    }

    offer = await SkillOffer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    let offer = await SkillOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    
    if (offer.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this offer' });
    }

    // Soft delete by changing status
    offer.status = 'paused';
    await offer.save();
    
    res.status(200).json({ success: true, data: offer, message: 'Offer deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 50);

    const offers = await SkillOffer.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const matches = await computeMatchesForUser(req.user.id);
    res.status(200).json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    // 1. Get matches
    const allMatches = await computeMatchesForUser(req.user.id);
    
    // 2. Find offers user already requested or interacted with
    const existingRequests = await SkillExchangeRequest.find({
      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ]
    });
    
    const excludedOfferIds = new Set(existingRequests.map(req => req.offer.toString()));

    // 3. Filter matches, prioritizing higher scores, tiebreak with recent created date
    const recommendations = allMatches
      .filter(match => !excludedOfferIds.has(match.otherOffer._id.toString()))
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return new Date(b.otherOffer.createdAt) - new Date(a.otherOffer.createdAt);
      })
      .slice(0, 50); // Cap unbounded result set

    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Requests
exports.createRequest = async (req, res) => {
  try {
    const { toUserId, offerId, message } = req.body;
    
    // Check if request already exists
    const existing = await SkillExchangeRequest.findOne({
      fromUser: req.user.id,
      toUser: toUserId,
      offer: offerId,
      status: 'pending'
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending request for this offer.' });
    }

    const request = new SkillExchangeRequest({
      fromUser: req.user.id,
      toUser: toUserId,
      offer: offerId,
      message
    });

    await request.save();
    
    // Notify the offer owner
    await notificationService.sendNotification({
      userId: toUserId,
      type: 'skill_swap_request',
      relatedContentId: request._id,
      actorId: req.user.id,
      message: `You have a new skill exchange request.`
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 50);

    // Get incoming and outgoing requests
    const incoming = await SkillExchangeRequest.find({ toUser: req.user.id })
      .populate('fromUser', 'name avatar')
      .populate('offer', 'skillName category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);
      
    const outgoing = await SkillExchangeRequest.find({ fromUser: req.user.id })
      .populate('toUser', 'name avatar')
      .populate('offer', 'skillName category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    res.status(200).json({ 
      success: true, 
      data: { incoming, outgoing } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const request = await SkillExchangeRequest.findById(req.params.id);
    
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    if (request.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this request' });
    }

    request.status = status;
    await request.save();
    
    // Notify the requester
    const notifType = status === 'accepted' ? 'skill_swap_accepted' : 'skill_swap_declined';
    await notificationService.sendNotification({
      userId: request.fromUser,
      type: notifType,
      relatedContentId: request._id,
      actorId: req.user.id,
      message: `Your skill exchange request was ${status}.`
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- Phase 2: Lifecycle & Reviews ---

exports.scheduleRequest = async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const request = await SkillExchangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted requests can be scheduled' });
    }

    if (request.fromUser.toString() !== req.user.id && request.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'pending'; // Actually the status enum has 'scheduled' ? No, the plan says we just set scheduledAt.
    // Wait, the plan expanded status to ['pending', 'accepted', 'declined', 'cancelled', 'completed', 'no-show']. It does NOT have 'scheduled'.
    // Ah, wait! The prompt said "extend status enum... pending/accepted/declined/cancelled/completed/no-show" and "SkillSession (new)... status enum: scheduled/completed/cancelled/no-show".
    // So scheduleRequest creates a SkillSession? Yes! Or wait, "PATCH /api/skill-swap/requests/:id/schedule — set scheduledAt once both sides agree (accepted requests only)".
    
    request.scheduledAt = new Date(scheduledAt);
    await request.save();

    // Create the session
    let session = await SkillSession.findOne({ request: request._id });
    if (!session) {
      session = new SkillSession({
        request: request._id,
        participants: [request.fromUser, request.toUser],
        scheduledAt: request.scheduledAt,
        status: 'scheduled'
      });
      await session.save();
    } else {
      session.scheduledAt = request.scheduledAt;
      await session.save();
    }

    const otherUser = request.fromUser.toString() === req.user.id ? request.toUser : request.fromUser;

    await notificationService.sendNotification({
      userId: otherUser,
      type: 'skill_swap_scheduled',
      relatedContentId: session._id,
      actorId: req.user.id,
      message: `Your skill exchange session has been scheduled.`
    });

    res.status(200).json({ success: true, data: { request, session } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const request = await SkillExchangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.fromUser.toString() !== req.user.id && request.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    const session = await SkillSession.findOne({ request: request._id });
    if (session) {
      session.status = 'completed';
      await session.save();
    }

    const otherUser = request.fromUser.toString() === req.user.id ? request.toUser : request.fromUser;

    await notificationService.sendNotification({
      userId: otherUser,
      type: 'skill_swap_completed',
      relatedContentId: session ? session._id : request._id,
      actorId: req.user.id,
      message: `Your skill exchange session was marked as completed. Don't forget to leave a review!`
    });

    // Badge Logic: first-swap, five-swaps
    const completedCount = await SkillSession.countDocuments({ participants: req.user.id, status: 'completed' });
    if (completedCount === 1) {
      await SkillSwapBadge.updateOne(
        { user: req.user.id, badgeType: 'first-swap' },
        { user: req.user.id, badgeType: 'first-swap' },
        { upsert: true }
      );
      await notificationService.sendNotification({ userId: req.user.id, type: 'skill_swap_badge', relatedContentId: request._id, message: 'You earned the First Swap badge!' });
    } else if (completedCount === 5) {
      await SkillSwapBadge.updateOne(
        { user: req.user.id, badgeType: 'five-swaps' },
        { user: req.user.id, badgeType: 'five-swaps' },
        { upsert: true }
      );
      await notificationService.sendNotification({ userId: req.user.id, type: 'skill_swap_badge', relatedContentId: request._id, message: 'You earned the Five Swaps badge!' });
    }
    
    const otherUserCompletedCount = await SkillSession.countDocuments({ participants: otherUser, status: 'completed' });
    if (otherUserCompletedCount === 1) {
      await SkillSwapBadge.updateOne({ user: otherUser, badgeType: 'first-swap' }, { $set: { user: otherUser, badgeType: 'first-swap' } }, { upsert: true });
      await notificationService.sendNotification({ userId: otherUser, type: 'skill_swap_badge', relatedContentId: request._id, message: 'You earned the First Swap badge!' });
    } else if (otherUserCompletedCount === 5) {
      await SkillSwapBadge.updateOne({ user: otherUser, badgeType: 'five-swaps' }, { $set: { user: otherUser, badgeType: 'five-swaps' } }, { upsert: true });
      await notificationService.sendNotification({ userId: otherUser, type: 'skill_swap_badge', relatedContentId: request._id, message: 'You earned the Five Swaps badge!' });
    }

    res.status(200).json({ success: true, data: { request, session } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const request = await SkillExchangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.fromUser.toString() !== req.user.id && request.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'cancelled';
    await request.save();

    const session = await SkillSession.findOne({ request: request._id });
    if (session) {
      session.status = 'cancelled';
      await session.save();
    }

    const otherUser = request.fromUser.toString() === req.user.id ? request.toUser : request.fromUser;

    await notificationService.sendNotification({
      userId: otherUser,
      type: 'skill_swap_cancelled',
      relatedContentId: request._id,
      actorId: req.user.id,
      message: `Your skill exchange was cancelled.`
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.leaveReview = async (req, res) => {
  try {
    const session = await SkillSession.findById(req.params.id).populate('participants');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot review an incomplete session' });
    }

    if (!session.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }

    const revieweeId = session.participants.find(p => p._id.toString() !== req.user.id)._id;

    const existingReview = await SkillReview.findOne({ session: session._id, reviewer: req.user.id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this session' });
    }

    const { rating, comment } = req.body;
    const review = new SkillReview({
      session: session._id,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      comment
    });

    await review.save();

    await notificationService.sendNotification({
      userId: revieweeId,
      type: 'skill_swap_review_received',
      relatedContentId: review._id,
      actorId: req.user.id,
      message: `You received a ${rating}-star review for your skill exchange.`
    });

    // Badge Logic: top-rated
    const allReviews = await SkillReview.find({ reviewee: revieweeId });
    if (allReviews.length >= 3) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      if (avg >= 4.5) {
        await SkillSwapBadge.updateOne(
          { user: revieweeId, badgeType: 'top-rated' },
          { user: revieweeId, badgeType: 'top-rated' },
          { upsert: true }
        );
        await notificationService.sendNotification({ userId: revieweeId, type: 'skill_swap_badge', relatedContentId: review._id, message: 'You earned the Top Rated badge!' });
      }
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'You have already reviewed this session' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 50);

    const sessions = await SkillSession.find({ participants: req.user.id })
      .populate('participants', 'name avatar')
      .populate({
         path: 'request',
         populate: { path: 'offer', select: 'skillName category' }
      })
      .sort({ scheduledAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);
      
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await SkillReview.find({ reviewee: req.params.id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });

    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    res.status(200).json({ 
      success: true, 
      data: {
        reviews,
        stats: {
          averageRating: Number(averageRating),
          reviewCount: reviews.length
        }
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserBadges = async (req, res) => {
  try {
    const badges = await SkillSwapBadge.find({ user: req.params.id }).sort({ earnedAt: -1 });
    res.status(200).json({ success: true, data: badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Phase 3: Reporting & Moderation ---

exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;
    
    // Validate target model
    let onModel;
    if (targetType === 'offer') onModel = 'SkillOffer';
    else if (targetType === 'user') onModel = 'User';
    else if (targetType === 'session') onModel = 'SkillSession';
    else return res.status(400).json({ success: false, message: 'Invalid target type' });

    const report = new SkillSwapReport({
      reportedBy: req.user.id,
      targetType,
      targetId,
      onModel,
      reason,
      description
    });

    await report.save();
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.markNoShow = async (req, res) => {
  try {
    const request = await SkillExchangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.fromUser.toString() !== req.user.id && request.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'scheduled' && request.status !== 'accepted') {
      // It can be scheduled or accepted depending on how phase 2 was implemented (request.status is just "accepted" in some cases)
    }

    request.status = 'no-show';
    await request.save();

    const session = await SkillSession.findOne({ request: request._id });
    if (session) {
      session.status = 'no-show';
      await session.save();
    }

    // Determine the offender (the OTHER person relative to who is calling this, assuming the caller is the one who showed up)
    // Wait, the caller is the person who SHOWED UP and is marking the OTHER person as no-show.
    const offenderId = request.fromUser.toString() === req.user.id ? request.toUser : request.fromUser;

    const offender = await User.findById(offenderId);
    if (offender) {
      offender.skillSwapNoShowCount = (offender.skillSwapNoShowCount || 0) + 1;
      await offender.save();
    }

    await notificationService.sendNotification({
      userId: offenderId,
      type: 'skill_swap_no_show', // Or use generic if not exists
      relatedContentId: request._id,
      actorId: req.user.id,
      message: `You were marked as a no-show for a skill exchange session.`
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.generateICS = async (req, res) => {
  try {
    const session = await SkillSession.findById(req.params.id)
      .populate('participants', 'name email');
    
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!session.scheduledAt) {
      return res.status(400).json({ success: false, message: 'Session is not scheduled yet' });
    }

    const startDate = new Date(session.scheduledAt);
    const endDate = new Date(startDate.getTime() + (session.durationMinutes || 60) * 60000);

    // Format YYYYMMDDTHHMMSSZ
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudentHub//SkillSwap//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(startDate)}`,
      `DTEND:${fmt(endDate)}`,
      `DTSTAMP:${fmt(new Date())}`,
      `UID:${session._id}@studenthub.com`,
      `SUMMARY:Skill Swap Session`,
      `DESCRIPTION:Skill exchange session with ${session.participants.map(p => p.name).join(' and ')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="skill-swap-session-${session._id}.ics"`);
    res.send(icsContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const offers = await SkillOffer.find({ user: userId }).lean();
    const sessions = await SkillSession.find({ participants: userId }).lean();
    const reviewsGiven = await SkillReview.find({ reviewer: userId }).lean();
    const reviewsReceived = await SkillReview.find({ reviewee: userId }).lean();
    const badges = await SkillSwapBadge.find({ user: userId }).lean();
    const reportsMade = await SkillSwapReport.find({ reportedBy: userId }).lean();

    const exportData = {
      offers,
      sessions,
      reviewsGiven,
      reviewsReceived,
      badges,
      reportsMade
    };

    res.setHeader('Content-disposition', 'attachment; filename=my-skill-swap-data.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    res.status(500).json({ message: 'Server error exporting data', error: err.message });
  }
};

// PHASE 9: Endorsements
exports.createEndorsement = async (req, res) => {
  try {
    const { endorseeId, skillName, basedOn, sessionId } = req.body;
    const endorserId = req.user.id;

    if (endorserId === endorseeId) {
      return res.status(400).json({ message: 'You cannot endorse yourself.' });
    }

    // Check if endorsee has this skill in an offer
    const offerExists = await SkillOffer.findOne({ user: endorseeId, skillName: skillName });
    if (!offerExists) {
      return res.status(400).json({ message: 'Endorsee does not offer this skill.' });
    }

    // Upsert to handle duplicates easily
    const endorsement = await SkillEndorsement.findOneAndUpdate(
      { endorser: endorserId, endorsee: endorseeId, skillName },
      { basedOn, session: sessionId || null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: endorsement });
  } catch (error) {
    console.error('Error creating endorsement:', error);
    res.status(500).json({ message: 'Server error creating endorsement' });
  }
};

exports.getUserEndorsements = async (req, res) => {
  try {
    const endorsements = await SkillEndorsement.find({ endorsee: req.params.id })
      .populate('endorser', 'name avatar');
    
    // Group by skillName and count
    const grouped = {};
    endorsements.forEach(end => {
      if (!grouped[end.skillName]) {
        grouped[end.skillName] = { total: 0, verified: 0, endorsers: [] };
      }
      grouped[end.skillName].total += 1;
      if (end.basedOn === 'completed-session') grouped[end.skillName].verified += 1;
      grouped[end.skillName].endorsers.push(end.endorser);
    });

    res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching endorsements' });
  }
};

// PHASE 9: Goals & Streaks
exports.createGoal = async (req, res) => {
  try {
    const { goalType, target, period } = req.body;
    const goal = new SkillGoal({
      user: req.user.id,
      goalType,
      target,
      period
    });
    await goal.save();
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating goal' });
  }
};

exports.getMyGoals = async (req, res) => {
  try {
    const goals = await SkillGoal.find({ user: req.user.id, status: 'active' });
    
    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      const progress = await skillStreakService.calculateGoalProgress(goal);
      const goalObj = goal.toObject();
      goalObj.progress = progress;
      if (progress >= goal.target && goal.status === 'active') {
        goal.status = 'completed';
        await goal.save();
        goalObj.status = 'completed';
      }
      return goalObj;
    }));

    res.status(200).json({ success: true, data: goalsWithProgress });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error fetching goals' });
  }
};

exports.getMyStreak = async (req, res) => {
  try {
    const streakData = await skillStreakService.calculateStreak(req.user.id);
    res.status(200).json({ success: true, data: streakData });
  } catch (error) {
    res.status(500).json({ message: 'Server error calculating streak' });
  }
};

exports.getNotificationDigest = async (req, res) => {
  try {
    const pendingRequests = await SkillExchangeRequest.countDocuments({ receiver: req.user.id, status: 'pending' });
    const scheduledSessions = await SkillSession.countDocuments({ participants: req.user.id, status: 'scheduled' });
    const pendingReviews = await SkillSession.countDocuments({
      participants: req.user.id,
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      data: {
        pendingRequests,
        scheduledSessions,
        pendingReviews,
        digestSummary: `You have ${pendingRequests} pending requests and ${scheduledSessions} scheduled sessions.`
      }
    });
  } catch (error) {
    console.error('Error fetching notification digest:', error);
    res.status(500).json({ message: 'Server error fetching notification digest' });
  }
};
