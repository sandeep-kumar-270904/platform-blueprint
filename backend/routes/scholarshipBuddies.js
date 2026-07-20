const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const scholarshipBuddyController = require('../controllers/scholarshipBuddyController');

router.use(authMiddleware);

router.post('/request-match', isNotBanned, scholarshipBuddyController.requestMatch);
router.get('/my-pairing', scholarshipBuddyController.getMyPairing);
router.post('/share-item', isNotBanned, scholarshipBuddyController.shareItem);
router.delete('/my-pairing', isNotBanned, scholarshipBuddyController.endPairing);

module.exports = router;
