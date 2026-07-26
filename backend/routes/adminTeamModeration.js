const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const {
  getTeamReports,
  updateTeamReport,
  getAdminTeams,
  getAdminTeamHuntAnalytics
} = require('../controllers/adminTeamModerationController');

// Admin check middleware
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

router.use(protect);
router.use(isAdmin);

router.get('/reports', getTeamReports);
router.put('/reports/:id', updateTeamReport);
router.get('/teams', getAdminTeams);
router.get('/analytics', getAdminTeamHuntAnalytics);

module.exports = router;
