const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');
const GroupMessage = require('../models/GroupMessage');
const GroupInvite = require('../models/GroupInvite');
const DSAProgress = require('../models/DSAProgress');
const InterviewPrepProgress = require('../models/InterviewPrepProgress');
const PlacementProfile = require('../models/PlacementProfile');
const authMiddleware = require('../middleware/auth');

// Helper to check member count
const getActiveMemberCount = (group) => {
  return group.memberships ? group.memberships.filter(m => m.status === 'active').length : 0;
};

// Get all study groups
router.get('/', async (req, res) => {
  try {
    const groups = await StudyGroup.find().sort({ createdAt: -1 });
    // Transform memberships for backward compatibility or let frontend handle it
    const transformedGroups = groups.map(g => {
      const obj = g.toObject();
      obj.member_count = getActiveMemberCount(g);
      return obj;
    });
    res.json(transformedGroups);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's active group memberships
router.get('/my-memberships', authMiddleware, async (req, res) => {
  try {
    const groups = await StudyGroup.find({ 
      memberships: { $elemMatch: { user: req.user.id, status: 'active' } } 
    }).select('_id');
    const groupIds = groups.map(g => g._id);
    res.json(groupIds);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, privacy, category, member_limit } = req.body;
    const newGroup = new StudyGroup({
      owner_id: req.user.id,
      name,
      description,
      privacy,
      category,
      member_limit,
      memberships: [{
        user: req.user.id,
        role: 'owner',
        status: 'active'
      }]
    });
    const savedGroup = await newGroup.save();
    
    req.io.emit('study_group_created', savedGroup);
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a group (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    if (group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete the group' });
    }
    
    await GroupMessage.deleteMany({ group_id: group._id });
    await GroupInvite.deleteMany({ group_id: group._id });
    await StudyGroup.deleteOne({ _id: group._id });
    
    req.io.emit('study_group_deleted', group._id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a public group
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    if (group.privacy !== 'public') {
      return res.status(400).json({ message: 'Cannot join private group directly' });
    }

    const existingMembership = group.memberships.find(m => m.user.toString() === req.user.id);
    if (existingMembership) {
      if (existingMembership.status === 'active') return res.status(400).json({ message: 'Already a member' });
      if (existingMembership.status === 'removed') {
        // Re-join logic
        if (getActiveMemberCount(group) >= group.member_limit) {
          return res.status(400).json({ message: 'Group is full' });
        }
        existingMembership.status = 'active';
        existingMembership.role = 'member'; // reset role
      }
    } else {
      if (getActiveMemberCount(group) >= group.member_limit) {
        return res.status(400).json({ message: 'Group is full' });
      }
      group.memberships.push({ user: req.user.id, role: 'member', status: 'active' });
    }
    
    await group.save();
    req.io.emit('study_group_updated', group);
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request to join private group
router.post('/:id/requests', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.privacy !== 'private') return res.status(400).json({ message: 'Group is public' });
    
    const existingMembership = group.memberships.find(m => m.user.toString() === req.user.id);
    if (existingMembership) {
      if (existingMembership.status === 'active') return res.status(400).json({ message: 'Already a member' });
      if (existingMembership.status === 'pending') return res.status(400).json({ message: 'Request already sent' });
      // If removed, allow requesting again
      if (existingMembership.status === 'removed') {
        existingMembership.status = 'pending';
      }
    } else {
      group.memberships.push({ user: req.user.id, role: 'member', status: 'pending' });
    }

    await group.save();
    req.io.emit('study_group_updated', group);
    res.json({ message: 'Request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve join request
router.post('/:id/requests/:userId/approve', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAuthorized = group.memberships.some(m => 
      m.user.toString() === req.user.id && m.status === 'active' && ['owner', 'admin'].includes(m.role)
    );
    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized' });

    const membership = group.memberships.find(m => m.user.toString() === req.params.userId && m.status === 'pending');
    if (!membership) return res.status(400).json({ message: 'No pending request' });

    if (getActiveMemberCount(group) >= group.member_limit) {
      return res.status(400).json({ message: 'Group is full' });
    }

    membership.status = 'active';
    await group.save();
    
    req.io.emit('study_group_updated', group);
    res.json({ message: 'Member approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper for owner leaving
const handleOwnerLeave = async (group) => {
  const activeMembers = group.memberships.filter(m => m.status === 'active' && m.user.toString() !== group.owner_id.toString());
  
  if (activeMembers.length === 0) {
    // Cascade delete if no one is left
    await GroupMessage.deleteMany({ group_id: group._id });
    await GroupInvite.deleteMany({ group_id: group._id });
    await StudyGroup.deleteOne({ _id: group._id });
    return true; // Indicates group was deleted
  }

  // Find oldest admin
  let nextOwner = activeMembers.find(m => m.role === 'admin');
  if (!nextOwner) {
    // If no admins, oldest member
    nextOwner = activeMembers.sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at))[0];
  }
  
  if (nextOwner) {
    nextOwner.role = 'owner';
    group.owner_id = nextOwner.user;
  }
  return false;
};

// Leave a group
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const membership = group.memberships.find(m => m.user.toString() === req.user.id);
    if (!membership) return res.status(400).json({ message: 'Not a member' });

    membership.status = 'removed';

    if (group.owner_id.toString() === req.user.id) {
      const deleted = await handleOwnerLeave(group);
      if (deleted) {
        req.io.emit('study_group_deleted', group._id);
        return res.json({ message: 'Group deleted because empty' });
      }
    }

    await group.save();
    req.io.emit('study_group_updated', group);
    res.json({ message: 'Left group' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a member
router.post('/:id/members/:userId/remove', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAuthorized = group.memberships.some(m => 
      m.user.toString() === req.user.id && m.status === 'active' && ['owner', 'admin'].includes(m.role)
    );
    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized' });

    if (group.owner_id.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove owner' });
    }

    const membership = group.memberships.find(m => m.user.toString() === req.params.userId);
    if (membership) {
      membership.status = 'removed';
    }

    await group.save();
    req.io.emit('study_group_updated', group);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Transfer ownership
router.post('/:id/transfer', authMiddleware, async (req, res) => {
  try {
    const { new_owner_id } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can transfer' });
    }

    const newOwnerMembership = group.memberships.find(m => m.user.toString() === new_owner_id && m.status === 'active');
    if (!newOwnerMembership) {
      return res.status(400).json({ message: 'New owner must be an active member' });
    }

    const currentOwnerMembership = group.memberships.find(m => m.user.toString() === req.user.id);
    if (currentOwnerMembership) {
      currentOwnerMembership.role = 'admin';
    }
    
    newOwnerMembership.role = 'owner';
    group.owner_id = new_owner_id;

    await group.save();
    req.io.emit('study_group_updated', group);
    res.json({ message: 'Ownership transferred' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group messages
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group_id: req.params.id })
      .populate('user_id', 'name avatar') // optional
      .sort({ created_at: 1 })
      .limit(200);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a group message (with threading support)
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content, parent_message_id } = req.body;
    const group_id = req.params.id;
    
    const group = await StudyGroup.findById(group_id);
    const membership = group.memberships.find(m => m.user.toString() === req.user.id && m.status === 'active');
    if (!membership) return res.status(403).json({ message: 'Must be active member to message' });

    const message = new GroupMessage({
      group_id,
      user_id: req.user.id,
      content,
      parent_message_id: parent_message_id || null
    });
    
    const savedMessage = await message.save();
    
    req.io.to(`group_${group_id}`).emit('group_message', savedMessage);
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('memberships.user', 'name avatar')
      .populate('shared_resources.added_by', 'name avatar');
    
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const obj = group.toObject();
    obj.member_count = getActiveMemberCount(group);
    
    // Support legacy structure for the frontend if it hasn't completely migrated
    obj.members = group.memberships.filter(m => m.status === 'active').map(m => m.user);
    obj.pending_members = group.memberships.filter(m => m.status === 'pending').map(m => m.user);

    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group members progress
router.get('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id).populate('memberships.user', 'name avatar');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const activeMemberships = group.memberships.filter(m => m.status === 'active');
    const memberIds = activeMemberships.map(m => m.user._id);

    const [dsaStats, prepStats, profiles] = await Promise.all([
      DSAProgress.find({ user_id: { $in: memberIds } }),
      InterviewPrepProgress.find({ user_id: { $in: memberIds } }),
      PlacementProfile.find({ user_id: { $in: memberIds } })
    ]);

    const progressData = activeMemberships.map(membership => {
      const member = membership.user;
      const dsa = dsaStats.find(p => p.user_id.toString() === member._id.toString());
      const prep = prepStats.find(p => p.user_id.toString() === member._id.toString());
      const profile = profiles.find(p => p.user_id.toString() === member._id.toString());

      return {
        user: { _id: member._id, name: member.name, avatar: member.avatar, role: membership.role },
        dsa_solved: dsa ? dsa.solved_problems.length : 0,
        prep_completed: prep ? prep.completed_items.length : 0,
        mock_sessions: profile ? profile.mock_sessions_completed || 0 : 0
      };
    });

    res.json(progressData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add shared resource
router.post('/:id/resources', authMiddleware, async (req, res) => {
  try {
    const { title, url } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const membership = group.memberships.find(m => m.user.toString() === req.user.id && m.status === 'active');
    if (!membership) return res.status(403).json({ message: 'Must be active member' });

    // Check for exact duplicate URL
    if (group.shared_resources.some(r => r.url === url)) {
      return res.status(400).json({ message: 'Resource URL already shared in this group' });
    }

    group.shared_resources.push({
      title,
      url,
      added_by: req.user.id
    });

    await group.save();
    const updatedGroup = await StudyGroup.findById(req.params.id).populate('shared_resources.added_by', 'name avatar');
    req.io.emit('study_group_updated', updatedGroup);
    res.json(updatedGroup.shared_resources);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove shared resource
router.delete('/:id/resources/:resId', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const membership = group.memberships.find(m => m.user.toString() === req.user.id && m.status === 'active');
    const resource = group.shared_resources.id(req.params.resId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (group.owner_id.toString() !== req.user.id && resource.added_by.toString() !== req.user.id) {
      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    group.shared_resources.pull(req.params.resId);
    await group.save();
    
    req.io.emit('study_group_updated', group);
    res.json({ message: 'Resource removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Redeem invite
router.post('/invites/redeem/:token', authMiddleware, async (req, res) => {
  try {
    const invite = await GroupInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ message: 'Invalid token' });
    
    if (invite.revoked || invite.uses >= invite.max_uses || new Date() > invite.expires_at) {
      return res.status(400).json({ message: 'Invite is expired or fully used' });
    }
    
    const group = await StudyGroup.findById(invite.group_id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const existingMembership = group.memberships.find(m => m.user.toString() === req.user.id);
    if (existingMembership) {
      if (existingMembership.status === 'active') return res.status(400).json({ message: 'Already a member' });
      if (existingMembership.status === 'removed') {
        if (getActiveMemberCount(group) >= group.member_limit) return res.status(400).json({ message: 'Group is full' });
        existingMembership.status = 'active';
      } else if (existingMembership.status === 'pending') {
        if (getActiveMemberCount(group) >= group.member_limit) return res.status(400).json({ message: 'Group is full' });
        existingMembership.status = 'active';
      }
    } else {
      if (getActiveMemberCount(group) >= group.member_limit) return res.status(400).json({ message: 'Group is full' });
      group.memberships.push({ user: req.user.id, role: 'member', status: 'active' });
    }
    
    await group.save();
    
    invite.uses += 1;
    await invite.save();
    
    req.io.emit('study_group_updated', group);
    res.json(group._id);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group invites
router.get('/:id/invites', authMiddleware, async (req, res) => {
  try {
    const invites = await GroupInvite.find({ group_id: req.params.id }).sort({ created_at: -1 });
    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invite info (public)
router.get('/invites/info/:token', async (req, res) => {
  try {
    const invite = await GroupInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    
    const group = await StudyGroup.findById(invite.group_id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    res.json({ invite, group });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group invite
router.post('/:id/invites', authMiddleware, async (req, res) => {
  try {
    const { role, expires_in_hours, max_uses } = req.body;
    const expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);
    
    const invite = new GroupInvite({
      group_id: req.params.id,
      created_by: req.user.id,
      role: role || 'member',
      expires_at,
      max_uses: max_uses || 25
    });
    
    const saved = await invite.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke invite
router.post('/invites/:id/revoke', authMiddleware, async (req, res) => {
  try {
    const invite = await GroupInvite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    
    invite.revoked = true;
    await invite.save();
    res.json(invite);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
