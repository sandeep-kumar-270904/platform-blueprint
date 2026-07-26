const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getMyInvites,
  respondToInvite
} = require('../controllers/teamInviteController');

router.get('/me', protect, getMyInvites);
router.put('/:id/respond', protect, respondToInvite);

module.exports = router;
