const express = require('express');
const router = express.Router();
const scholarshipController = require('../controllers/scholarshipController');
const protect = require('../middleware/auth');

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Public / User routes
router.get('/', scholarshipController.getScholarships);
router.get('/saved', protect, scholarshipController.getSavedScholarships);
router.get('/applications', protect, scholarshipController.getApplications);
router.get('/:id', scholarshipController.getScholarshipDetails);

router.post('/:id/apply', protect, scholarshipController.apply);
router.post('/:id/save', protect, scholarshipController.toggleSave);
router.post('/:id/match-explanation', protect, scholarshipController.getMatchExplanation);
router.put('/applications/:id', protect, scholarshipController.updateApplicationStatus);

// Submissions (Verified Orgs / Users)
router.post('/', protect, scholarshipController.submitScholarship);

// Admin review routes
router.get('/admin/pending', protect, checkRole(['admin', 'moderator']), scholarshipController.getPendingReviews);
router.post('/admin/:id/review', protect, checkRole(['admin', 'moderator']), scholarshipController.reviewScholarship);
router.get('/admin/analytics', protect, checkRole(['admin', 'moderator']), scholarshipController.getAdminAnalytics);

module.exports = router;
