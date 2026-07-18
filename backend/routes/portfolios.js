const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/auth');

// Public route for viewing portfolios
router.get('/public/:slug', portfolioController.getPublicPortfolio);
router.get('/public/:slug/timeline', portfolioController.getTimeline);

// Protected routes
router.use(authMiddleware);
router.get('/my-portfolio', portfolioController.getMyPortfolio);
router.post('/my-portfolio', portfolioController.createOrUpdatePortfolio);

module.exports = router;
