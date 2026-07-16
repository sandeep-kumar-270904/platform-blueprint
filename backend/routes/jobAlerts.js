const express = require('express');
const router = express.Router();
const JobAlert = require('../models/JobAlert');
const authMiddleware = require('../middleware/auth');

// POST /api/job-alerts
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, criteria, frequency } = req.body;
    if (!name) return res.status(400).json({ message: 'Alert name is required' });

    const alert = new JobAlert({
      user: req.user.id,
      name,
      criteria: criteria || {},
      frequency: frequency || 'daily'
    });

    await alert.save();
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/job-alerts/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const alerts = await JobAlert.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/job-alerts/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await JobAlert.findOne({ _id: req.params.id, user: req.user.id });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    const { name, criteria, frequency, active } = req.body;
    if (name) alert.name = name;
    if (criteria) alert.criteria = criteria;
    if (frequency) alert.frequency = frequency;
    if (active !== undefined) alert.active = active;

    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/job-alerts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await JobAlert.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
