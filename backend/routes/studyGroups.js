const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');
const GroupMessage = require('../models/GroupMessage');
const authMiddleware = require('../middleware/auth');

// Get all study groups
router.get('/', async (req, res) => {
  try {
    const groups = await StudyGroup.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's group memberships
router.get('/my-memberships', authMiddleware, async (req, res) => {
  try {
    const groups = await StudyGroup.find({ members: req.user.id }).select('_id');
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
      members: [req.user.id] // Owner automatically joins
    });
    const savedGroup = await newGroup.save();
    
    // Broadcast event
    req.io.emit('study_group_created', savedGroup);
    
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a group
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }
    
    if (group.members.length >= group.member_limit) {
      return res.status(400).json({ message: 'Group is full' });
    }
    
    group.members.push(req.user.id);
    await group.save();
    
    req.io.emit('study_group_updated', group);
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a group
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    group.members = group.members.filter(m => m.toString() !== req.user.id);
    await group.save();
    
    req.io.emit('study_group_updated', group);
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group messages
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group_id: req.params.id })
      .sort({ created_at: 1 })
      .limit(200);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const GroupInvite = require('../models/GroupInvite');

// Send a group message
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const group_id = req.params.id;
    
    const message = new GroupMessage({
      group_id,
      user_id: req.user.id,
      content
    });
    
    const savedMessage = await message.save();
    
    req.io.to(`group_${group_id}`).emit('group_message', savedMessage);
    
    res.status(201).json(savedMessage);
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
    
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }
    
    if (group.members.length >= group.member_limit) {
      return res.status(400).json({ message: 'Group is full' });
    }
    
    group.members.push(req.user.id);
    await group.save();
    
    invite.uses += 1;
    await invite.save();
    
    req.io.emit('study_group_updated', group);
    res.json(group._id);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
