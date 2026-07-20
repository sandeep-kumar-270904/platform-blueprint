const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const scholarshipAdminController = require('../controllers/scholarshipAdminController');

const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/reports/priority', scholarshipAdminController.getPriorityReports);
router.post('/:id/mark-at-risk', scholarshipAdminController.markAtRisk);
router.get('/data-consistency', scholarshipAdminController.checkDataConsistency);

// Phase 6
router.patch('/:id/stacking-rules', scholarshipAdminController.updateStackingRules);
router.post('/scam-patterns', scholarshipAdminController.createScamPattern);
router.get('/scam-patterns', scholarshipAdminController.getScamPatterns);
router.patch('/scam-patterns/:id', scholarshipAdminController.updateScamPattern);
router.post('/:id/relink-cycle', scholarshipAdminController.relinkCycle);

// Phase 7
router.post('/:id/translate', scholarshipAdminController.translateScholarship);
router.patch('/:id/translations/:language', scholarshipAdminController.updateTranslation);
router.patch('/:id/renewal-requirements', scholarshipAdminController.updateRenewalRequirements);

// Phase 8 Dashboards
router.get('/reviews', scholarshipAdminController.getReviews);
router.get('/circles', scholarshipAdminController.getCircles);
router.get('/awardee-stories', scholarshipAdminController.getAwardeeStories);
router.get('/compliance-checks', scholarshipAdminController.getComplianceChecks);

router.post('/awardee-stories/:id/moderate', scholarshipAdminController.moderateAwardeeStory);
router.post('/compliance-checks/:id/verify', scholarshipAdminController.verifyComplianceCheck);
router.post('/compliance-checks/:id/flag', scholarshipAdminController.flagComplianceCheck);

router.get('/ecosystem-health', scholarshipAdminController.getEcosystemHealth);

module.exports = router;


