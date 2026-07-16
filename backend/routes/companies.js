const express = require('express');
const router = express.Router();
const CompanyFollow = require('../models/CompanyFollow');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

// POST /api/companies/:companyName/follow
router.post('/:companyName/follow', authMiddleware, async (req, res) => {
  try {
    const { companyName } = req.params;
    
    // UPSERT or catch duplicate key
    try {
      const follow = await CompanyFollow.create({
        user: req.user.id,
        companyName
      });
      res.status(201).json(follow);
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ message: 'Already following this company' });
      }
      throw e;
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/companies/:companyName/follow
router.delete('/:companyName/follow', authMiddleware, async (req, res) => {
  try {
    const { companyName } = req.params;
    const follow = await CompanyFollow.findOneAndDelete({ user: req.user.id, companyName });
    
    if (!follow) return res.status(404).json({ message: 'Not following this company' });
    res.json({ message: 'Unfollowed company' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/companies/followed
router.get('/followed', authMiddleware, async (req, res) => {
  try {
    const follows = await CompanyFollow.find({ user: req.user.id }).lean();
    
    // Add open job counts
    const companyNames = follows.map(f => f.companyName);
    
    // Aggregate job counts
    const jobCounts = await Job.aggregate([
      { $match: { 'company.name': { $in: companyNames }, status: 'published' } },
      { $group: { _id: '$company.name', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    jobCounts.forEach(jc => countMap[jc._id] = jc.count);

    const enriched = follows.map(f => ({
      ...f,
      openJobs: countMap[f.companyName] || 0
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
