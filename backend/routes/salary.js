const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const SalaryEntry = require('../models/SalaryEntry');
const AlumniProfile = require('../models/AlumniProfile');
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/salary/submit
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { currentRole, currentCompany, showCompany, showName, ctcBand, yearsOfExperience } = req.body;
    
    // Validate alum profile
    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!alumniProfile) {
      return res.status(403).json({ message: 'You must be a verified alumni to submit salary data.' });
    }
    
    if (alumniProfile.verificationStatus !== 'verified') {
      return res.status(403).json({ message: 'Your alumni profile is not verified yet.' });
    }
    
    if (!alumniProfile.willingness?.openToSalarySharing) {
      return res.status(403).json({ message: 'You must opt-in to salary sharing in your profile settings.' });
    }

    // Rate limiting: 1 submission per 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentEntry = await SalaryEntry.findOne({
      userId: req.user.id,
      createdAt: { $gte: sixMonthsAgo }
    });

    if (recentEntry) {
      return res.status(429).json({ message: 'You can only submit salary data once every 6 months.' });
    }

    // Basic outlier flagging logic (can be expanded later)
    // E.g., flagging very high CTC bands for low experience
    let initialStatus = 'pending'; // Requires admin approval to go live
    if (yearsOfExperience < 2 && ctcBand === '> 30 LPA') {
      initialStatus = 'flagged';
    }

    const newEntry = new SalaryEntry({
      alumniId: alumniProfile._id,
      userId: req.user.id,
      collegeId: alumniProfile.collegeId,
      branch: alumniProfile.branch,
      graduationYear: alumniProfile.graduationYear,
      currentRole,
      currentCompany,
      showCompany,
      showName,
      ctcBand,
      yearsOfExperience,
      status: initialStatus
    });

    await newEntry.save();
    res.status(201).json({ message: 'Salary entry submitted successfully for review.', entry: newEntry });

  } catch (error) {
    console.error('Error submitting salary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/salary/colleges/:id/stats
router.get('/colleges/:id/stats', async (req, res) => {
  try {
    const collegeId = req.params.id;
    const MIN_SAMPLE_SIZE = 5;

    // Fetch approved entries for the college
    const entries = await SalaryEntry.find({ collegeId, status: 'approved' })
      .populate('userId', 'name full_name avatar_url profilePicture')
      .lean();
      
    if (!entries || entries.length === 0) {
      return res.json({ message: 'not enough data yet', sampleSize: 0, aggregate: [], entries: [] });
    }

    // Prepare anonymized individual entries
    const anonymizedEntries = entries.map(entry => {
      return {
        _id: entry._id,
        branch: entry.branch,
        graduationYear: entry.graduationYear,
        ctcBand: entry.ctcBand,
        yearsOfExperience: entry.yearsOfExperience,
        currentRole: entry.currentRole,
        currentCompany: entry.showCompany ? entry.currentCompany : null,
        user: entry.showName ? {
          name: entry.userId.name || entry.userId.full_name,
          avatar: entry.userId.avatar_url || entry.userId.profilePicture
        } : null,
        createdAt: entry.createdAt
      };
    });

    // We can aggregate by branch + year
    // Map CTC bands to numerical approximations for aggregation purposes
    const ctcBandMap = {
      '< 3 LPA': 2,
      '3-5 LPA': 4,
      '5-8 LPA': 6.5,
      '8-12 LPA': 10,
      '12-20 LPA': 16,
      '20-30 LPA': 25,
      '> 30 LPA': 35
    };

    // Build the aggregation
    const aggregationResult = await SalaryEntry.aggregate([
      { $match: { collegeId: require('mongoose').Types.ObjectId(collegeId), status: 'approved' } },
      { 
        $group: {
          _id: { branch: "$branch", graduationYear: "$graduationYear" },
          count: { $sum: 1 },
          entries: { $push: "$ctcBand" }
        }
      }
    ]);

    const stats = aggregationResult.map(group => {
      if (group.count < MIN_SAMPLE_SIZE) {
        return {
          branch: group._id.branch,
          graduationYear: group._id.graduationYear,
          count: group.count,
          hasEnoughData: false
        };
      }

      // Calculate approximate median / mode
      const values = group.entries.map(b => ctcBandMap[b]).sort((a,b) => a-b);
      const medianVal = values[Math.floor(values.length / 2)];
      
      // Reverse map to band
      let medianBand = Object.keys(ctcBandMap).find(key => ctcBandMap[key] === medianVal) || 'Unknown';

      return {
        branch: group._id.branch,
        graduationYear: group._id.graduationYear,
        count: group.count,
        hasEnoughData: true,
        medianBand: medianBand
      };
    });

    res.json({
      sampleSize: entries.length,
      aggregate: stats,
      entries: anonymizedEntries
    });

  } catch (error) {
    console.error('Error fetching salary stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/salary/admin/queue
router.get('/admin/queue', authMiddleware, isAdmin, async (req, res) => {
  try {
    const entries = await SalaryEntry.find({ status: { $in: ['pending', 'flagged'] } })
      .populate('userId', 'name full_name email')
      .populate('collegeId', 'name')
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching admin salary queue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/salary/admin/queue/:id
router.put('/admin/queue/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    
    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const entry = await SalaryEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    entry.status = status;
    if (adminNote) entry.adminNote = adminNote;
    
    await entry.save();
    res.json({ message: `Salary entry ${status}`, entry });
  } catch (error) {
    console.error('Error updating salary entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
