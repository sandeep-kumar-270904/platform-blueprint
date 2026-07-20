const express = require('express');
const router = express.Router();
const providerFeedbackController = require('../controllers/providerFeedbackController');
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');

router.use(authMiddleware);

// Applicant submitting feedback
router.post('/applications/:appId/provider-feedback', isNotBanned, providerFeedbackController.submitFeedback);

// Provider/Admin viewing feedback
router.get('/:id/provider-feedback', providerFeedbackController.getRawFeedback);
router.get('/:id/provider-feedback/summary', providerFeedbackController.getFeedbackSummary);

module.exports = router;
