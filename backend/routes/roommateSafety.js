const express = require('express');
const router = express.Router();
const roommateSafetyController = require('../controllers/roommateSafetyController');
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');

// Route: /api/roommates/safety

router.post('/report', auth, checkSuspended, roommateSafetyController.reportUser);
router.post('/block', auth, checkSuspended, roommateSafetyController.blockUser);
router.post('/unblock', auth, checkSuspended, roommateSafetyController.unblockUser);
router.get('/blocks', auth, roommateSafetyController.getBlockedUsers);
router.get('/export', auth, roommateSafetyController.exportData);

module.exports = router;
