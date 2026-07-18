const express = require('express');
const router = express.Router();
const developerApiController = require('../controllers/developerApiController');
const auth = require('../middleware/auth');

router.post('/token', auth, developerApiController.generateToken);
router.get('/tokens', auth, developerApiController.getMyTokens);
router.put('/token/:id/revoke', auth, developerApiController.revokeToken);

// Public route requiring the token in header
router.get('/public/resume-data', developerApiController.getResumeData);

module.exports = router;
