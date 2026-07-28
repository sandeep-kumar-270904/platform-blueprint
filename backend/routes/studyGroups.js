const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');
const authMiddleware = require('../middleware/auth');

// Helper: Count active members
const getActiveMemberCount = (group) => {
  if (!group.memberships) return 0;
  return group.memberships.filter(m => m.status === 'active').length;
};

// GET /api/study-groups - Fetch Discover groups (supports search & excludes joined)
router.get('/', async (req, res) => {
  try {
    const { search, excludeUserId } = req.query;
    
    let query = {};
    
    // Server-side Search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { category: searchRegex }
      ];
    }
    
    // Exclude groups the user is already in (or pending in)
    if (excludeUserId) {
      query.memberships = { 
        $not: { $elemMatch: { user: excludeUserId } } 
      };
    }

    // Optionally exclude full groups
    // If we wanted to, but the prompt says "Return all public (plus eligible private) groups"
    // So we'll just fetch them and the frontend will show the member count

    const groups = await StudyGroup.find(query).sort({ createdAt: -1 });
    
    const transformedGroups = groups.map(g => {
      const obj = g.toObject();
      obj.member_count = getActiveMemberCount(g);
      delete obj.memberships; // Clean up payload
      return obj;
    });
    
    res.json(transformedGroups);
  } catch (error) {
    console.error('Fetch study groups error:', error);
    res.status(500).json({ message: 'Server error fetching groups.' });
  }
});

// GET /api/study-groups/my-memberships - Fetch full groups user has joined
router.get('/my-memberships', authMiddleware, async (req, res) => {
  try {
    const groups = await StudyGroup.find({
      memberships: { $elemMatch: { user: req.user.id, status: 'active' } }
    }).sort({ createdAt: -1 });
    
    const transformedGroups = groups.map(g => {
      const obj = g.toObject();
      obj.member_count = getActiveMemberCount(g);
      delete obj.memberships; // Clean up payload
      return obj;
    });
    
    res.json(transformedGroups);
  } catch (error) {
    console.error('Fetch my memberships error:', error);
    res.status(500).json({ message: 'Server error fetching memberships.' });
  }
});

// POST /api/study-groups - Create a new group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, privacy, member_limit } = req.body;
    
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and focus area are required.' });
    }

    const newGroup = new StudyGroup({
      name,
      description,
      category,
      privacy: privacy || 'public',
      member_limit: member_limit || 50,
      owner_id: req.user.id,
      memberships: [{
        user: req.user.id,
        role: 'owner',
        status: 'active'
      }]
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    console.error('Create study group error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A group with that name already exists. Please choose another.' });
    }
    res.status(500).json({ message: 'Server error creating group.' });
  }
});

// POST /api/study-groups/:id/join - Request to join or join public group
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Check if already a member or pending
    const existingMembership = group.memberships.find(m => m.user.toString() === req.user.id);
    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return res.status(400).json({ message: 'Already a member.' });
      } else {
        return res.status(400).json({ message: 'Join request already pending.' });
      }
    }

    // Check member limit
    if (getActiveMemberCount(group) >= group.member_limit) {
      return res.status(400).json({ message: 'Group has reached its member limit.' });
    }

    // Add membership
    const status = group.privacy === 'public' ? 'active' : 'pending';
    group.memberships.push({
      user: req.user.id,
      role: 'member',
      status
    });

    await group.save();
    res.json({ message: status === 'active' ? 'Joined successfully.' : 'Join request sent.' });
  } catch (error) {
    console.error('Join study group error:', error);
    res.status(500).json({ message: 'Server error joining group.' });
  }
});

module.exports = router;
