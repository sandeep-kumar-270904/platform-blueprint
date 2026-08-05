const express = require('express');
const router = express.Router();
const RoommateGroup = require('../models/RoommateGroup');
const RoommateProfile = require('../models/RoommateProfile');
const RoommateChat = require('../models/RoommateChat');
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');
const rateLimit = require('express-rate-limit');

// Phase 30: Rate limiter for group actions to prevent spam/abuse
const groupActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 30, // limit each IP to 30 group actions per windowMs
  message: { message: 'Too many group actions, please try again later.' }
});

// Helper to geocode a location and add privacy jitter
async function geocodeLocation(locationString) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationString)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'AntiGravityBlueprint' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      // Add random spatial jitter (approx up to 500m) for privacy
      const lat = parseFloat(data[0].lat) + (Math.random() - 0.5) * 0.01;
      const lon = parseFloat(data[0].lon) + (Math.random() - 0.5) * 0.01;
      return [lon, lat]; // GeoJSON uses [longitude, latitude]
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
}

// Map to: /api/roommates/groups

const calculateCompatibility = (myProfile, group) => {
  if (!myProfile || !group) return { score: 0 };
  let score = 50; // Base score
  if (myProfile.budgetRange && group.budgetRange) {
    if (myProfile.budgetRange.max >= group.budgetRange.min && myProfile.budgetRange.min <= group.budgetRange.max) score += 25;
  }
  if (myProfile.preferredLocations && group.preferredLocations) {
    const overlap = myProfile.preferredLocations.some(l => group.preferredLocations.includes(l));
    if (overlap) score += 25;
  }
  return { score: Math.min(100, score) };
};

// GET /discover - Discover groups
router.get('/discover', auth, checkSuspended, async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    let query = { status: 'open' };

    // Location Radius Filter
    if (lat && lng && radius) {
      const radiusInRadians = parseFloat(radius) / 6371; // Earth radius in km
      query.location = {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
        }
      };
    }

    const user = await User.findById(req.user.id);
    const blockedAndMuted = [...(user.blocked_users || []), ...(user.muted_users || [])].map(id => id.toString());
    const usersWhoBlockedMe = await User.find({ blocked_users: req.user.id }).select('_id');
    const usersWhoBlockedMeIds = usersWhoBlockedMe.map(u => u._id.toString());
    const excludedUsers = [...blockedAndMuted, ...usersWhoBlockedMeIds];

    query.admin = { $nin: excludedUsers };
    query.members = { $ne: req.user.id };
    query.pendingRequests = { $ne: req.user.id };

    const groups = await RoommateGroup.find(query).populate('admin members', 'name full_name profilePicture avatar_url');

    const myProfile = await RoommateProfile.findOne({ user: req.user.id });

    let result = groups.map(g => {
      let gObj = g.toObject();
      if (myProfile) {
        gObj.compatibilityScore = calculateCompatibility(myProfile, g).score;
      } else {
        gObj.compatibilityScore = 0;
      }
      return gObj;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /my-groups - Get groups user is in or pending
router.get('/my-groups', auth, async (req, res) => {
  try {
    const groups = await RoommateGroup.find({
      $or: [
        { admin: req.user.id },
        { members: req.user.id },
        { pendingRequests: req.user.id }
      ]
    }).populate('admin members', 'name full_name profilePicture avatar_url');
    res.json(groups);
  } catch (error) {
    console.error('Error fetching my groups:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST / - Create a group
router.post('/', auth, checkSuspended, groupActionLimiter, async (req, res) => {
  try {
    const { name, description, targetSize, preferredLocations, budgetRange, moveInDate } = req.body;
    
    const myProfile = await RoommateProfile.findOne({ user: req.user.id });
    if (!myProfile) {
      return res.status(400).json({ message: 'You must have a completed profile to create a group.' });
    }

    let location = { type: 'Point', coordinates: [0, 0] };
    if (preferredLocations && preferredLocations.length > 0) {
      const coords = await geocodeLocation(preferredLocations[0]);
      if (coords) location.coordinates = coords;
    }

    const newGroup = new RoommateGroup({
      name,
      description,
      admin: req.user.id,
      targetSize,
      members: [req.user.id],
      preferredLocations,
      budgetRange,
      moveInDate,
      location,
      status: 'open'
    });

    await newGroup.save();

    // Create a group chat
    const newChat = new RoommateChat({
      groupId: newGroup._id,
      participants: [req.user.id],
      messages: []
    });
    await newChat.save();

    res.json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /:id/join - Send join request
router.post('/:id/join', auth, checkSuspended, groupActionLimiter, async (req, res) => {
  try {
    const group = await RoommateGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.status !== 'open') return res.status(400).json({ message: 'Group is not open' });

    if (group.members.includes(req.user.id) || group.pendingRequests.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member or requested to join' });
    }

    // Phase 30: Mutual exclusion block check
    const adminUser = await User.findById(group.admin);
    const requesterUser = await User.findById(req.user.id);
    
    if (adminUser?.blocked_users?.includes(req.user.id) || requesterUser?.blocked_users?.includes(group.admin)) {
      return res.status(403).json({ message: 'You cannot join this group due to privacy settings.' });
    }

    group.pendingRequests.push(req.user.id);
    await group.save();

    res.json({ message: 'Request sent' });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /:id/requests - Get paginated pending requests
router.get('/:id/requests', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const group = await RoommateGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.admin.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const totalRequests = group.pendingRequests.length;
    
    // Manual slice to avoid complex aggregation, then populate
    const paginatedIds = group.pendingRequests.slice(skip, skip + limit);
    
    // We fetch user profiles instead of raw user objects since roommate finder uses profiles
    const profiles = await RoommateProfile.find({ user: { $in: paginatedIds } })
      .populate('user', 'name full_name email profilePicture avatar_url location university');

    res.json({
      requests: profiles,
      total: totalRequests,
      page,
      pages: Math.ceil(totalRequests / limit)
    });
  } catch (error) {
    console.error('Error fetching group requests:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /:id/respond - Admin responds to request
router.post('/:id/respond', auth, async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'accept', 'reject'
    
    // Phase 31: Optimistic locking using $pull
    const group = await RoommateGroup.findOneAndUpdate(
      { _id: req.params.id, admin: req.user.id, pendingRequests: userId },
      { $pull: { pendingRequests: userId } },
      { new: true }
    );
    
    if (!group) {
      // Find out if it was just unauthorized, not found, or already handled
      const exists = await RoommateGroup.findById(req.params.id);
      if (!exists) return res.status(404).json({ message: 'Group not found' });
      if (exists.admin.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
      return res.status(400).json({ message: 'This request has already been handled.' });
    }

    if (action === 'accept') {
      if (group.members.length >= group.targetSize) {
        return res.status(400).json({ message: 'Group is already full' });
      }
      group.members.push(userId);
      
      // Update chat participants
      const chat = await RoommateChat.findOne({ groupId: group._id });
      if (chat && !chat.participants.includes(userId)) {
        chat.participants.push(userId);
        await chat.save();
      }

      if (group.members.length >= group.targetSize) {
        group.status = 'closed';
      }
    }

    await group.save();

    res.json({ message: `Request ${action}ed` });
  } catch (error) {
    console.error('Error responding to group request:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /:id/leave - Member leaves
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await RoommateGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.admin.toString() === req.user.id) {
      return res.status(400).json({ message: 'Admin cannot leave without disbanding or transferring.' });
    }

    group.members = group.members.filter(id => id.toString() !== req.user.id);
    if (group.status === 'closed') {
      group.status = 'open';
    }
    await group.save();

    // Remove from chat participants
    const chat = await RoommateChat.findOne({ groupId: group._id });
    if (chat) {
      chat.participants = chat.participants.filter(id => id.toString() !== req.user.id);
      await chat.save();
    }

    res.json({ message: 'Left group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /:id/remove - Admin removes member
router.post('/:id/remove', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await RoommateGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.admin.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    group.members = group.members.filter(id => id.toString() !== userId);
    if (group.status === 'closed') {
      group.status = 'open';
    }
    await group.save();

    // Remove from chat participants
    const chat = await RoommateChat.findOne({ groupId: group._id });
    if (chat) {
      chat.participants = chat.participants.filter(id => id.toString() !== userId);
      await chat.save();
    }

    res.json(group);
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
