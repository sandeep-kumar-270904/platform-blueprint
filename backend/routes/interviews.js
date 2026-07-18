const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const protect = require('../middleware/auth');

router.use(protect);

router.post('/start', interviewController.startSession);
router.get('/:id', interviewController.getSession);
router.post('/:id/questions/:questionId/answer', interviewController.answerQuestion);

module.exports = router;
