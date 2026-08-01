const express = require('express');
const router = express.Router();
const roommateChatController = require('../controllers/roommateChatController');
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');

// Map to: /api/roommates/chat

// Get chat by connection ID
router.get('/:connectionId', auth, roommateChatController.getChatByConnectionId);

// Get chat by group ID
router.get('/group/:groupId', auth, roommateChatController.getChatByGroupId);

// Send message
router.post('/:connectionId', auth, checkSuspended, roommateChatController.sendMessage);

// Mark as read
router.post('/:connectionId/read', auth, checkSuspended, roommateChatController.markAsRead);

module.exports = router;
