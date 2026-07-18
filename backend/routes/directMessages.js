const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');
const directMessageController = require('../controllers/directMessageController');

router.use(auth);

router.get('/', directMessageController.getConversations);
router.get('/:id', directMessageController.getConversationById);

router.post('/', checkSuspended, directMessageController.sendMessage); // New conversation
router.post('/:id/messages', checkSuspended, directMessageController.sendMessage); // Reply to existing
router.post('/:id/read', checkSuspended, directMessageController.markAsRead);

module.exports = router;
