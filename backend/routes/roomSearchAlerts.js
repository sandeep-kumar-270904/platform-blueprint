const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RoomSearchAlert = require('../models/RoomSearchAlert');

// Create search alert
router.post('/', auth, async (req, res) => {
  try {
    const { title, criteria, isActive } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const alertCount = await RoomSearchAlert.countDocuments({ user: req.user.id });
    if (alertCount >= 5) {
      return res.status(400).json({ message: 'Maximum of 5 search alerts allowed per user.' });
    }

    let sanitizedCriteria = {};
    if (criteria) {
      if (criteria.location && typeof criteria.location === 'string') sanitizedCriteria.location = criteria.location.trim();
      if (criteria.maxRent && !isNaN(criteria.maxRent)) sanitizedCriteria.maxRent = Number(criteria.maxRent);
      if (criteria.minBeds && !isNaN(criteria.minBeds)) sanitizedCriteria.minBeds = Number(criteria.minBeds);
      if (['All', 'Single', 'Shared', 'Entire Unit'].includes(criteria.roomType)) sanitizedCriteria.roomType = criteria.roomType;
    }

    const alert = new RoomSearchAlert({
      user: req.user.id,
      title: title.trim(),
      criteria: sanitizedCriteria,
      isActive: isActive !== undefined ? isActive : true
    });

    await alert.save();
    res.status(201).json(alert);
  } catch (err) {
    console.error('Error creating search alert:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get user's search alerts
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await RoomSearchAlert.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching search alerts:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update search alert
router.put('/:id', auth, async (req, res) => {
  try {
    const alert = await RoomSearchAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (alert.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    if (req.body.title && typeof req.body.title === 'string' && req.body.title.trim()) {
      alert.title = req.body.title.trim();
    }
    
    if (req.body.criteria) {
      const c = req.body.criteria;
      const sanitized = { ...alert.criteria };
      if (c.location !== undefined) sanitized.location = typeof c.location === 'string' ? c.location.trim() : sanitized.location;
      if (c.maxRent !== undefined) sanitized.maxRent = !isNaN(c.maxRent) ? Number(c.maxRent) : sanitized.maxRent;
      if (c.minBeds !== undefined) sanitized.minBeds = !isNaN(c.minBeds) ? Number(c.minBeds) : sanitized.minBeds;
      if (c.roomType !== undefined && ['All', 'Single', 'Shared', 'Entire Unit'].includes(c.roomType)) sanitized.roomType = c.roomType;
      alert.criteria = sanitized;
    }
    
    if (req.body.isActive !== undefined) alert.isActive = req.body.isActive;

    await alert.save();
    res.json(alert);
  } catch (err) {
    console.error('Error updating search alert:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete search alert
router.delete('/:id', auth, async (req, res) => {
  try {
    const alert = await RoomSearchAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (alert.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await alert.deleteOne();
    res.json({ message: 'Alert removed' });
  } catch (err) {
    console.error('Error deleting search alert:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
