const express = require('express');
const router = express.Router();
const coverLetterController = require('../controllers/coverLetterController');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 15, // limit each user to 15 generations per day
  message: { message: 'Daily cover letter generation limit reached. Please try again tomorrow.' },
  keyGenerator: (req) => req.user.id
});

router.use(requireAuth);

router.get('/', coverLetterController.getCoverLetters);
router.post('/', coverLetterController.createCoverLetter);
router.get('/:id', coverLetterController.getCoverLetter);
router.put('/:id', coverLetterController.updateCoverLetter);
router.delete('/:id', coverLetterController.deleteCoverLetter);

router.post('/generate', aiLimiter, coverLetterController.generateContent);

module.exports = router;
