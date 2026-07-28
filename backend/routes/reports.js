const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Report = require('../models/Report');
const StudyGroup = require('../models/StudyGroup');

// Helper to map frontend targetTypes to backend content_types
const mapTargetType = (type) => {
  const map = {
    'group': 'study_group',
    'member': 'group_member',
    'message': 'group_message'
  };
  return map[type] || type; // fallback to type if it's already a valid content_type
};

// POST /api/reports - Create a new moderation report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, reason, notes, contextData } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Missing required fields: targetType, targetId, reason' });
    }

    const contentType = mapTargetType(targetType);

    // Specific logic for Study Groups reporting
    if (['study_group', 'group_member', 'group_message'].includes(contentType)) {
      
      let groupId = contextData?.groupId || (contentType === 'study_group' ? targetId : null);
      
      if (!groupId && contentType !== 'study_group') {
        return res.status(400).json({ message: 'groupId is required in contextData for member/message reports' });
      }

      // Check if group exists and if reporter is trying to report their own group
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        // Return 201 even if deleted to prevent probing, but don't save
        return res.status(201).json({ message: 'Report submitted successfully' });
      }

      if (contentType === 'study_group' && group.owner_id.toString() === req.user.id) {
        return res.status(400).json({ message: 'You cannot report your own group' });
      }

      // Prevent duplicate spam: Has this user reported this exact targetId with 'pending' status?
      const existingReport = await Report.findOne({
        reported_by: req.user.id,
        content_id: targetId,
        content_type: contentType,
        status: 'pending'
      });

      if (existingReport) {
        return res.status(429).json({ message: 'You already have a pending report for this entity' });
      }

      // Save the report
      const report = new Report({
        content_type: contentType,
        content_id: targetId,
        reported_by: req.user.id,
        reason,
        notes,
        context_data: contextData
      });
      await report.save();

      // Flag the group for the Admin Moderation queue (from Phase 7)
      if (!group.isFlagged) {
        group.isFlagged = true;
        await group.save();
      }

      return res.status(201).json({ message: 'Report submitted successfully' });
    }

    // Generic fallback for other types (if this endpoint handles non-study-group entities eventually)
    // Anti-spam check
    const existing = await Report.findOne({
      reported_by: req.user.id,
      content_id: targetId,
      content_type: contentType,
      status: 'pending'
    });

    if (existing) {
      return res.status(429).json({ message: 'You already have a pending report for this entity' });
    }

    const report = new Report({
      content_type: contentType,
      content_id: targetId,
      reported_by: req.user.id,
      reason,
      notes,
      context_data: contextData
    });
    await report.save();

    res.status(201).json({ message: 'Report submitted successfully' });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error while submitting report', error: error.message });
  }
});

module.exports = router;
