const Report = require('../models/Report');
const User = require('../models/User');
const RoommateConnection = require('../models/RoommateConnection');
const RoommateChat = require('../models/RoommateChat');

exports.reportUser = async (req, res) => {
  try {
    const { targetUserId, reason, notes, contextData } = req.body;

    if (!targetUserId || !reason) {
      return res.status(400).json({ message: 'Target user ID and reason are required' });
    }

    const report = new Report({
      content_type: 'roommate_profile',
      content_id: targetUserId, // We use user ID as the content ID
      reported_by: req.user.id,
      reason,
      notes,
      context_data: contextData, // e.g. specific chat message if reported from chat
      status: 'pending'
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    // 1. Add to blocker's blocked_users array
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blocked_users: targetUserId }
    });

    // 2. Remove any active or pending connection
    const connection = await RoommateConnection.findOne({
      $or: [
        { requester: req.user.id, recipient: targetUserId },
        { requester: targetUserId, recipient: req.user.id }
      ]
    });

    if (connection) {
      await connection.deleteOne();
      
      // 3. Archive any associated chat
      await RoommateChat.findOneAndUpdate(
        { connectionId: connection._id },
        { status: 'archived' }
      );
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blocked_users: targetUserId }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blocked_users', 'name full_name profilePicture avatar_url');
    res.json(user.blocked_users || []);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
