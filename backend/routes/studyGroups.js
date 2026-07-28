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

// GET /api/study-groups/:id - Fetch group details with populated members
router.get('/:id', async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('memberships.user', 'username avatar_url learningStreak quizStreak full_name')
      .populate('resources.added_by', 'username avatar_url');
      
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    
    const obj = group.toObject();
    obj.member_count = getActiveMemberCount(group);
    res.json(obj);
  } catch (error) {
    console.error('Fetch group detail error:', error);
    res.status(500).json({ message: 'Server error fetching group details.' });
  }
});

// PUT /api/study-groups/:id/memberships/:userId - Approve/Deny
router.put('/:id/memberships/:userId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'rejected'
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    
    if (group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can manage memberships.' });
    }

    const membershipIndex = group.memberships.findIndex(m => m.user.toString() === req.params.userId);
    if (membershipIndex === -1) return res.status(404).json({ message: 'Membership not found.' });

    if (status === 'active') {
      if (getActiveMemberCount(group) >= group.member_limit) {
        return res.status(400).json({ message: 'Group is full.' });
      }
      group.memberships[membershipIndex].status = 'active';
    } else if (status === 'rejected') {
      group.memberships.splice(membershipIndex, 1);
    }
    
    await group.save();
    res.json(group);
  } catch (error) {
    console.error('Manage membership error:', error);
    res.status(500).json({ message: 'Server error managing membership.' });
  }
});

// POST /api/study-groups/:id/leave
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.owner_id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Owner cannot leave. You must delete the group.' });
    }

    group.memberships = group.memberships.filter(m => m.user.toString() !== req.user.id);
    await group.save();
    res.json({ message: 'Left group successfully.' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error leaving group.' });
  }
});

// DELETE /api/study-groups/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete the group.' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error deleting group.' });
  }
});

// POST /api/study-groups/:id/resources
router.post('/:id/resources', authMiddleware, async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).json({ message: 'Title and URL are required.' });

    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Must be active member
    const membership = group.memberships.find(m => m.user.toString() === req.user.id && m.status === 'active');
    if (!membership && group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only active members can add resources.' });
    }

    group.resources.push({ title, url, added_by: req.user.id });
    await group.save();
    
    // Return populated resources
    const updatedGroup = await StudyGroup.findById(req.params.id).populate('resources.added_by', 'username avatar_url');
    res.json(updatedGroup.resources);
  } catch (error) {
    console.error('Add resource error:', error);
    res.status(500).json({ message: 'Server error adding resource.' });
  }
});

// DELETE /api/study-groups/:id/resources/:resourceId
router.delete('/:id/resources/:resourceId', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const resource = group.resources.id(req.params.resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });

    if (group.owner_id.toString() !== req.user.id && resource.added_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this resource.' });
    }

    resource.deleteOne();
    await group.save();
    res.json({ message: 'Resource deleted.' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error deleting resource.' });
  }
});

module.exports = router;
