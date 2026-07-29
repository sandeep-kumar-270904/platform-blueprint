const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');
const GroupMessage = require('../models/GroupMessage');
const GroupSession = require('../models/GroupSession');
const AdminAuditLog = require('../models/AdminAuditLog');
const authMiddleware = require('../middleware/auth');
// We'll use req.app.get('io') for websockets
// Middleware to enforce Admin Role
const adminMiddleware = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  next();
};

// Apply middlewares to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/study-groups - Fetch all groups
router.get('/', async (req, res) => {
  try {
    const groups = await StudyGroup.find()
      .populate('owner_id', 'username full_name')
      .sort({ createdAt: -1 });

    const transformedGroups = groups.map(g => {
      const obj = g.toObject();
      obj.member_count = obj.memberships ? obj.memberships.filter(m => m.status === 'active').length : 0;
      delete obj.memberships;
      return obj;
    });

    res.json(transformedGroups);
  } catch (error) {
    console.error('Admin fetch groups error:', error);
    res.status(500).json({ message: 'Server error fetching groups.' });
  }
});

// GET /api/admin/study-groups/:id/members - Fetch members for a group
router.get('/:id/members', async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('memberships.user', 'username full_name');
    
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    res.json(group.memberships);
  } catch (error) {
    console.error('Admin fetch members error:', error);
    res.status(500).json({ message: 'Server error fetching members.' });
  }
});

// POST /api/admin/study-groups/:id/flag - Toggle flag status
router.post('/:id/flag', async (req, res) => {
  try {
    const { isFlagged } = req.body;
    const group = await StudyGroup.findByIdAndUpdate(
      req.params.id, 
      { isFlagged }, 
      { new: true }
    );
    
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Log the action
    await AdminAuditLog.create({
      adminId: req.user.id,
      action: isFlagged ? 'flag_group' : 'unflag_group',
      targetId: group._id.toString(),
      details: { groupName: group.name }
    });

    res.json(group);
  } catch (error) {
    console.error('Admin flag group error:', error);
    res.status(500).json({ message: 'Server error flagging group.' });
  }
});

// DELETE /api/admin/study-groups/:id - Disband group
router.delete('/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // 1. Delete associated data
    await GroupMessage.deleteMany({ group_id: groupId });
    await GroupSession.deleteMany({ group_id: groupId });

    // 2. Delete the group itself
    await StudyGroup.findByIdAndDelete(groupId);

    // 3. Log the destructive action
    await AdminAuditLog.create({
      adminId: req.user.id,
      action: 'delete_group',
      targetId: groupId,
      details: { groupName: group.name, reason: 'Disbanded via Admin Dashboard' }
    });

    // Note: To cleanly disconnect sockets, you would typically use:
    // req.app.get('io').to('group_' + groupId).disconnectSockets();
    // Assuming io is attached to req.app in server.js
    if (req.app.get('io')) {
      req.app.get('io').to('group_' + groupId).disconnectSockets();
    }

    res.json({ message: 'Group disbanded successfully.' });
  } catch (error) {
    console.error('Admin delete group error:', error);
    res.status(500).json({ message: 'Server error deleting group.' });
  }
});

// DELETE /api/admin/study-groups/:id/members/:userId - Kick a member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const group = await StudyGroup.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Edge Case: Do not allow kicking the owner
    if (group.owner_id.toString() === userId.toString()) {
      return res.status(400).json({ 
        message: 'Cannot kick the owner of a group. You must reassign ownership or disband the group entirely.' 
      });
    }

    // Remove the user from memberships array
    await StudyGroup.findByIdAndUpdate(id, {
      $pull: { memberships: { user: userId } }
    });

    // Log the kick action
    await AdminAuditLog.create({
      adminId: req.user.id,
      action: 'kick_member',
      targetId: id,
      details: { groupName: group.name, kickedUserId: userId }
    });

    // Force disconnect the specific user's socket from the group room
    // Typically requires tracking socket -> userId mapping.
    if (req.app.get('io')) {
      req.app.get('io').to('group_' + id).emit('member_removed', { userId });
    }

    res.json({ message: 'Member kicked successfully.' });
  } catch (error) {
    console.error('Admin kick member error:', error);
    res.status(500).json({ message: 'Server error kicking member.' });
  }
});

module.exports = router;
