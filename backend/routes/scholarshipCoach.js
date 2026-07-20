const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const scholarshipCoachController = require('../controllers/scholarshipCoachController');
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  message: { message: 'Too many messages sent. Please try again later.' }
});

router.use(authMiddleware);

router.get('/session', scholarshipCoachController.getSession);
router.post('/message', isNotBanned, chatLimiter, scholarshipCoachController.sendMessage);

module.exports = router;
