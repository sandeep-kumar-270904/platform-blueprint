const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const institutionScholarshipController = require('../controllers/institutionScholarshipController');

const requireInstitutionAdmin = (req, res, next) => {
  if (!req.user || !req.user.institutionId || req.user.institutionId.toString() !== req.params.institutionId) {
    return res.status(403).json({ message: 'Forbidden: Not an admin for this institution' });
  }
  next();
};

router.use(authMiddleware);
router.use(requireInstitutionAdmin);

router.post('/pooled', isNotBanned, institutionScholarshipController.createPooledScholarship);
router.get('/:id/allocation-dashboard', institutionScholarshipController.getAllocationDashboard);
router.post('/:id/award', isNotBanned, institutionScholarshipController.awardApplication);

module.exports = router;
