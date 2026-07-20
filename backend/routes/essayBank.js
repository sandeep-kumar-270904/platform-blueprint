const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const essayBankController = require('../controllers/essayBankController');
const rateLimit = require('express-rate-limit');

const adaptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many adaptation requests, please try again later.' }
});

router.use(authMiddleware);

router.post('/', essayBankController.createEssay);
router.get('/', essayBankController.getEssays);
router.get('/:id', essayBankController.getEssay);
router.patch('/:id', essayBankController.updateEssay);
router.delete('/:id', essayBankController.deleteEssay);

router.post('/:id/adapt', adaptLimiter, essayBankController.adaptEssay);

const essayTemplateController = require('../controllers/essayTemplateController');
const isNotBanned = require('../middleware/isNotBanned');
router.post('/:id/create-template', isNotBanned, essayTemplateController.createTemplate);

module.exports = router;
