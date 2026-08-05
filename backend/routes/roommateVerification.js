const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/roommateVerificationController');
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');
const rateLimit = require('express-rate-limit');

// Phase 30: Rate limiter for verification requests to prevent spam
const verificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hour window
  max: 5, // limit each IP to 5 requests per day
  message: { message: 'Too many verification attempts, please try again tomorrow.' }
});

// Route: /api/roommates/verification

router.post('/request-email-code', auth, checkSuspended, verificationLimiter, verificationController.requestEmailCode);
router.post('/confirm-email-code', auth, checkSuspended, verificationController.confirmEmailCode);
router.post('/request-id-review', auth, checkSuspended, verificationLimiter, verificationController.requestIdReview);
router.get('/status', auth, verificationController.getStatus);

module.exports = router;
