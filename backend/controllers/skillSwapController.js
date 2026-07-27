const SkillOffer = require('../models/SkillOffer');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const SkillSession = require('../models/SkillSession');
const SkillReview = require('../models/SkillReview');
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

    const offers = await SkillOffer.find(query)
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await SkillOffer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: offers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
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
    const offers = await SkillOffer.find({ user: req.user.id }).sort({ createdAt: -1 });
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
    // Get incoming and outgoing requests
    const incoming = await SkillExchangeRequest.find({ toUser: req.user.id })
      .populate('fromUser', 'name avatar')
      .populate('offer', 'skillName category');
      
    const outgoing = await SkillExchangeRequest.find({ fromUser: req.user.id })
      .populate('toUser', 'name avatar')
      .populate('offer', 'skillName category');

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
    const sessions = await SkillSession.find({ participants: req.user.id })
      .populate('participants', 'name avatar')
      .populate({
         path: 'request',
         populate: { path: 'offer', select: 'skillName category' }
      })
      .sort({ scheduledAt: -1 });
      
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
