const SkillOffer = require('../models/SkillOffer');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const { computeMatchesForUser } = require('../services/skillMatchService');

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
    
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
