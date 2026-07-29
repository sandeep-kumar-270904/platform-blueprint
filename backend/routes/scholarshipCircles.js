const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const ScholarshipCircle = require('../models/ScholarshipCircle');
const ScholarshipApplication = require('../models/ScholarshipApplication');

// Create a new circle
router.post('/', isNotBanned, auth, async (req, res) => {
  try {
    const { name, sharedGoal } = req.body;
    
    // Check creation limit
    const userCircles = await ScholarshipCircle.countDocuments({ createdBy: req.user.userId });
    if (userCircles >= 5) {
      return res.status(400).json({ message: 'Maximum circle creation limit reached (5).' });
    }

    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await ScholarshipCircle.findOne({ inviteCode });
      if (!existing) isUnique = true;
    }
    
    const circle = new ScholarshipCircle({
      name,
      inviteCode,
      createdBy: req.user.userId,
      memberIds: [req.user.userId],
      sharedGoal
    });
    
    await circle.save();
    res.status(201).json(circle);
  } catch (error) {
    console.error('Error creating circle:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// List user's circles
router.get('/', auth, async (req, res) => {
  try {
    const circles = await ScholarshipCircle.find({ memberIds: req.user.userId })
      .populate('memberIds', 'name email profilePicture')
      .populate('createdBy', 'name');
    res.json(circles);
  } catch (error) {
    console.error('Error fetching circles:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get circle details with aggregate progress
router.get('/:id', auth, async (req, res) => {
  try {
    const circle = await ScholarshipCircle.findById(req.params.id)
      .populate('memberIds', 'name email profilePicture')
      .populate('sharedScholarships.scholarshipId');
      
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (!circle.memberIds.some(m => m._id.toString() === req.user.userId)) {
      return res.status(403).json({ message: 'Not a member of this circle' });
    }

    // Compute aggregate progress
    const apps = await ScholarshipApplication.find({
      userId: { $in: circle.memberIds.map(m => m._id) }
    });

    const aggregate = {
      totalApplicationsStarted: apps.length,
      totalApplicationsSubmitted: apps.filter(a => ['submitted', 'under_review', 'awarded', 'rejected'].includes(a.status)).length,
      totalAwarded: apps.filter(a => a.status === 'awarded').length,
      memberProgress: {} 
    };
    
    const membersSubmitted = new Set(apps.filter(a => ['submitted', 'under_review', 'awarded', 'rejected'].includes(a.status)).map(a => a.userId.toString()));
    const membersStarted = new Set(apps.map(a => a.userId.toString()));
    
    aggregate.membersWithAtLeastOneSubmission = membersSubmitted.size;
    aggregate.membersWithAtLeastOneStarted = membersStarted.size;

    res.json({ circle, aggregate });
  } catch (error) {
    console.error('Error fetching circle details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Join a circle
router.post('/join', isNotBanned, auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    // Atomic join with max 6 members limit and unique check
    const circle = await ScholarshipCircle.findOneAndUpdate(
      { 
        inviteCode: inviteCode.toUpperCase(),
        'memberIds.5': { $exists: false }, // Enforces array size < 6
        memberIds: { $ne: req.user.userId } // Enforces uniqueness
      },
      { $addToSet: { memberIds: req.user.userId } },
      { new: true }
    );
    
    if (!circle) {
      // Check why it failed to give a helpful error
      const existing = await ScholarshipCircle.findOne({ inviteCode: inviteCode.toUpperCase() });
      if (!existing) return res.status(404).json({ message: 'Invalid invite code' });
      if (existing.memberIds.includes(req.user.userId)) return res.status(400).json({ message: 'Already a member' });
      if (existing.memberIds.length >= 6) return res.status(400).json({ message: 'Circle is full (maximum 6 members)' });
      return res.status(400).json({ message: 'Failed to join circle' });
    }
    
    res.json(circle);
  } catch (error) {
    console.error('Error joining circle:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Share a scholarship to the circle
router.post('/:id/share', isNotBanned, auth, async (req, res) => {
  try {
    const { scholarshipId } = req.body;
    const circle = await ScholarshipCircle.findById(req.params.id);
    
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (!circle.memberIds.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Not a member' });
    }
    
    const alreadyShared = circle.sharedScholarships.some(s => s.scholarshipId.toString() === scholarshipId);
    if (!alreadyShared) {
      circle.sharedScholarships.push({
        scholarshipId,
        addedBy: req.user.userId
      });
      await circle.save();
    }
    
    res.json(circle);
  } catch (error) {
    console.error('Error sharing scholarship:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Leave a circle
router.delete('/:id/leave', isNotBanned, auth, async (req, res) => {
  try {
    const circle = await ScholarshipCircle.findOneAndUpdate(
      { _id: req.params.id, memberIds: req.user.userId },
      { $pull: { memberIds: req.user.userId } },
      { new: true }
    );

    if (!circle) return res.status(404).json({ message: 'Circle not found or not a member' });
    
    // Optional: if circle.memberIds.length === 0, we could delete it, but leaving it empty is fine.
    res.json({ message: 'Left circle successfully' });
  } catch (error) {
    console.error('Error leaving circle:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
