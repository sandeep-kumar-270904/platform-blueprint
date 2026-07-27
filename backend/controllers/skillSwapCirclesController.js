const SkillCircle = require('../models/SkillCircle');
const SkillOffer = require('../models/SkillOffer');
const SkillCircleSession = require('../models/SkillCircleSession');
const SkillCircleMessage = require('../models/SkillCircleMessage');
const notificationService = require('../services/notificationService');

exports.createCircle = async (req, res) => {
  try {
    const { skillName, category, description, maxMembers, recurrence, scheduleInfo } = req.body;
    const userId = req.user.userId;

    const circle = new SkillCircle({
      creator: userId,
      skillName,
      category,
      description,
      maxMembers: maxMembers || 8,
      members: [userId],
      recurrence,
      scheduleInfo
    });

    await circle.save();
    res.status(201).json(circle);
  } catch (error) {
    console.error('Error creating circle:', error);
    res.status(500).json({ message: 'Server error creating circle', error: error.message });
  }
};

exports.getCircles = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 50);
    
    const query = { status: 'open' };
    if (category) query.category = category;
    if (search) query.skillName = { $regex: search, $options: 'i' };

    const circles = await SkillCircle.find(query)
      .populate('creator', 'name full_name avatar_url')
      .sort({ createdAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    const total = await SkillCircle.countDocuments(query);
    
    res.json({
      circles,
      pagination: { total, page: Number(page), pages: Math.ceil(total / safeLimit) }
    });
  } catch (error) {
    console.error('Error fetching circles:', error);
    res.status(500).json({ message: 'Server error fetching circles' });
  }
};

exports.getCircleDetail = async (req, res) => {
  try {
    const circle = await SkillCircle.findById(req.params.id)
      .populate('creator', 'name full_name avatar_url')
      .populate('members', 'name full_name avatar_url');
      
    if (!circle) return res.status(404).json({ message: 'Circle not found' });

    const sessions = await SkillCircleSession.find({ circle: circle._id }).sort({ scheduledAt: 1 });
    
    let messages = [];
    const isMember = circle.members.some(m => m._id.toString() === req.user.userId);
    if (isMember) {
      messages = await SkillCircleMessage.find({ circle: circle._id })
        .populate('sender', 'name full_name avatar_url')
        .sort({ createdAt: -1 })
        .limit(50);
      messages.reverse(); // chronological for chat
    }

    res.json({ circle, sessions, messages: isMember ? messages : [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching circle details' });
  }
};

exports.joinCircle = async (req, res) => {
  try {
    const userId = req.user.userId;
    const circle = await SkillCircle.findById(req.params.id);
    
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.status !== 'open') return res.status(400).json({ message: 'Circle is not open for joining' });
    
    if (circle.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    circle.members.push(userId);
    if (circle.members.length >= circle.maxMembers) {
      circle.status = 'full';
    }
    await circle.save();

    await notificationService.createNotification({
      userId: circle.creator,
      type: 'skill_swap_request',
      relatedContentId: circle._id,
      message: 'A new user joined your Skill Circle.'
    });

    res.json({ message: 'Successfully joined circle', circle });
  } catch (error) {
    res.status(500).json({ message: 'Server error joining circle' });
  }
};

exports.leaveCircle = async (req, res) => {
  try {
    const userId = req.user.userId;
    const circle = await SkillCircle.findById(req.params.id);
    
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    
    const memberIndex = circle.members.findIndex(m => m.toString() === userId);
    if (memberIndex === -1) return res.status(400).json({ message: 'Not a member' });

    // Remove user
    circle.members.splice(memberIndex, 1);
    
    if (circle.creator.toString() === userId) {
      if (circle.members.length > 0) {
        // Reassign to oldest remaining member
        circle.creator = circle.members[0];
      } else {
        // Cancel circle if empty
        circle.status = 'cancelled';
        await SkillCircleSession.updateMany(
          { circle: circle._id, status: 'scheduled' },
          { $set: { status: 'cancelled' } }
        );
      }
    }

    if (circle.status === 'full' && circle.members.length < circle.maxMembers) {
      circle.status = 'open';
    }

    await circle.save();
    res.json({ message: 'Successfully left circle', circle });
  } catch (error) {
    res.status(500).json({ message: 'Server error leaving circle' });
  }
};

exports.cancelCircle = async (req, res) => {
  try {
    const circle = await SkillCircle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    
    if (circle.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    circle.status = 'cancelled';
    await circle.save();

    await SkillCircleSession.updateMany(
      { circle: circle._id, status: 'scheduled' },
      { $set: { status: 'cancelled' } }
    );

    // Notify members
    circle.members.forEach(memberId => {
      if (memberId.toString() !== req.user.userId) {
        notificationService.createNotification({
          userId: memberId,
          type: 'skill_swap_request',
          relatedContentId: circle._id,
          message: `The Skill Circle "${circle.skillName}" was cancelled.`
        }).catch(console.error);
      }
    });

    res.json({ message: 'Circle cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error cancelling circle' });
  }
};

exports.editCircle = async (req, res) => {
  try {
    const { description, maxMembers, scheduleInfo } = req.body;
    const circle = await SkillCircle.findById(req.params.id);
    
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (description) circle.description = description;
    if (scheduleInfo) circle.scheduleInfo = scheduleInfo;
    
    if (maxMembers) {
      if (maxMembers < circle.members.length) {
        return res.status(400).json({ message: 'Max members cannot be less than current member count' });
      }
      circle.maxMembers = maxMembers;
      circle.status = circle.members.length >= maxMembers ? 'full' : 'open';
    }

    await circle.save();
    res.json(circle);
  } catch (error) {
    res.status(500).json({ message: 'Server error editing circle' });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const { attendees } = req.body;
    const session = await SkillCircleSession.findById(req.params.sessionId).populate('circle');
    
    if (!session || session.circle._id.toString() !== req.params.id) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (session.circle.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.status = 'completed';
    session.attendees = attendees || [];
    await session.save();

    res.json({ message: 'Session completed', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error completing session' });
  }
};

exports.getMyCircles = async (req, res) => {
  try {
    const circles = await SkillCircle.find({ members: req.user.userId })
      .populate('creator', 'name full_name avatar_url')
      .sort({ createdAt: -1 });
    res.json({ circles });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching your circles' });
  }
};

exports.getRecommendedCircles = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Get user's offers to find interests and categories
    const userOffers = await SkillOffer.find({ user: userId });
    
    const wantsToLearn = new Set();
    const myCategories = new Set();
    
    userOffers.forEach(offer => {
      myCategories.add(offer.category);
      if (offer.wantsToLearn) {
        offer.wantsToLearn.forEach(skill => wantsToLearn.add(skill.toLowerCase()));
      }
    });

    // Find open circles the user hasn't joined
    const openCircles = await SkillCircle.find({ 
      status: 'open',
      members: { $ne: userId }
    }).populate('creator', 'name avatar');

    // Score them
    const scoredCircles = openCircles.map(circle => {
      let score = 0;
      
      // 1. Skill overlap (highly weighted)
      if (wantsToLearn.has(circle.skillName.toLowerCase())) {
        score += 50;
      }

      // 2. Category overlap
      if (myCategories.has(circle.category)) {
        score += 20;
      }

      // 3. Open slots weight (capacity ratio)
      const openSlots = circle.maxMembers - circle.members.length;
      if (openSlots > 0) {
        // e.g., 5 open slots out of 10 max = 0.5 * 20 = 10 points
        score += (openSlots / circle.maxMembers) * 20; 
      }

      return { circle, score };
    });

    const recommended = scoredCircles
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => s.circle);

    res.status(200).json({ success: true, data: recommended });
  } catch (error) {
    console.error('Error fetching recommended circles:', error);
    res.status(500).json({ message: 'Server error fetching recommendations' });
  }
};
