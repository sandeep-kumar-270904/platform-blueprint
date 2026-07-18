const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const coachController = require('../controllers/coachController');

// All coach routes require authentication
router.use(authMiddleware);

router.get('/session', coachController.getSession);
router.post('/chat', coachController.sendMessage);
router.delete('/session', coachController.clearSession);

module.exports = router;
