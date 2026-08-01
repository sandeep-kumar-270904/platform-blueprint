const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const analyticsController = require('../controllers/roommateAnalyticsController');

// Record a view for a user profile
router.post('/:id/view', authMiddleware, analyticsController.recordProfileView);

// Get personal analytics dashboard
router.get('/', authMiddleware, analyticsController.getAnalytics);

module.exports = router;
