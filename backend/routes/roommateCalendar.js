const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roommateCalendarController = require('../controllers/roommateCalendarController');

// Toggle calendar sync for individual move-in date
router.post('/sync-profile', authMiddleware, roommateCalendarController.syncProfileMoveIn);

// Sync group move-in date to calendar
router.post('/sync-group/:id', authMiddleware, roommateCalendarController.syncGroupMoveIn);

// Schedule a meetup/viewing in chat and optionally sync
router.post('/meetup/:chatId', authMiddleware, roommateCalendarController.scheduleMeetup);

// Sync rent reminder
router.post('/sync-rent/:agreementId', authMiddleware, roommateCalendarController.syncRentReminder);

module.exports = router;
