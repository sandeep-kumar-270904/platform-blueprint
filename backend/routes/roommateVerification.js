const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/roommateVerificationController');
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');

// Route: /api/roommates/verification

router.post('/request-email-code', auth, checkSuspended, verificationController.requestEmailCode);
router.post('/confirm-email-code', auth, checkSuspended, verificationController.confirmEmailCode);
router.post('/request-id-review', auth, checkSuspended, verificationController.requestIdReview);
router.get('/status', auth, verificationController.getStatus);

module.exports = router;
