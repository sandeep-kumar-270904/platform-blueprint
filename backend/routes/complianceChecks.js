const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const complianceCheckController = require('../controllers/complianceCheckController');

router.use(authMiddleware);

router.get('/application/:applicationId', isNotBanned, complianceCheckController.getApplicantChecks);

// Applicant submitting proof
router.post('/:id/submit-proof', isNotBanned, complianceCheckController.submitProof);

// Admin / Provider verifying proof
router.post('/:id/verify', isNotBanned, complianceCheckController.verifyProof);
router.post('/:id/flag-at-risk', isNotBanned, complianceCheckController.flagAtRisk);

module.exports = router;

