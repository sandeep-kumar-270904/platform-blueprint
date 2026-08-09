const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ComparisonSet = require('../models/ComparisonSet');
const College = require('../models/College');
const auth = require('../middleware/auth');

// POST /api/comparisons - save current Compare selection as a named set
router.post('/', auth, async (req, res) => {
  try {
    const { name, collegeIds } = req.body;
    
    if (!collegeIds || !Array.isArray(collegeIds) || collegeIds.length < 2 || collegeIds.length > 3) {
      return res.status(400).json({ message: 'A comparison must contain 2 or 3 colleges.' });
    }

    const shareToken = crypto.randomBytes(8).toString('hex');
    const defaultName = name || `Comparison ${new Date().toLocaleDateString()}`;

    const comparison = await ComparisonSet.create({
      userId: req.user.id,
      name: defaultName,
      colleges: collegeIds,
      shareToken
    });

    res.status(201).json(comparison);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/comparisons - list user's saved sets
router.get('/', auth, async (req, res) => {
  try {
    const comparisons = await ComparisonSet.find({ userId: req.user.id })
      .populate('colleges', 'name logoOrIcon location type')
      .sort({ createdAt: -1 });
    res.json(comparisons);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/comparisons/shared/:shareToken - public, no auth required
router.get('/shared/:shareToken', async (req, res) => {
  try {
    const comparison = await ComparisonSet.findOne({ shareToken: req.params.shareToken })
      .populate('colleges', 'name logoOrIcon location type fees avgPackage placementPercentage coursesOffered facilities');
    
    if (!comparison) {
      return res.status(404).json({ message: 'Comparison set not found' });
    }
    
    res.json(comparison);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
