const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ApplicationStatus = require('../models/ApplicationStatus');

// GET /api/college-applications - Get all for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const apps = await ApplicationStatus.find({ userId: req.user.id })
      .populate('collegeId', 'name logoOrIcon location type')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/college-applications - Create/Update status for a college
router.post('/', auth, async (req, res) => {
  try {
    const { collegeId, status, appliedDate, decisionDate, notes } = req.body;
    
    if (!collegeId) return res.status(400).json({ message: 'College ID is required' });

    const app = await ApplicationStatus.findOneAndUpdate(
      { userId: req.user.id, collegeId },
      { status, appliedDate, decisionDate, notes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('collegeId', 'name logoOrIcon location type');
    
    res.json(app);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/college-applications/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await ApplicationStatus.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
