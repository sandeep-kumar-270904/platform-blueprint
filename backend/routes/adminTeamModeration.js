const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Institution = require('../models/Institution');

const {
  getTeamReports,
  updateTeamReport,
  getAdminTeams,
  getAdminTeamHuntAnalytics,
  closeTeam,
  removeTeam,
  flagTeam,
  banCreator
} = require('../controllers/adminTeamModerationController');

// Admin & Institution Admin check middleware
const isAdminOrInstitutionAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    
    if (user.role === 'admin') {
      return next();
    }
    
    if (user.institutionId) {
      const institution = await Institution.findById(user.institutionId);
      if (institution && institution.adminUserIds.includes(req.user.id)) {
        req.query.institutionId = user.institutionId.toString();
        return next();
      }
    }
    
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

router.use(protect);
router.use(isAdminOrInstitutionAdmin);

router.get('/reports', getTeamReports);
router.put('/reports/:id', updateTeamReport);
router.get('/teams', getAdminTeams);
router.put('/teams/:id/close', closeTeam);
router.delete('/teams/:id', removeTeam);
router.put('/teams/:id/flag', flagTeam);
router.post('/users/:id/ban', banCreator);
router.get('/analytics', getAdminTeamHuntAnalytics);

module.exports = router;
