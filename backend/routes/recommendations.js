const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// Public routes for external submission
router.get('/public/:token', recommendationController.getRecommendationByToken);
router.post('/public/draft', recommendationController.draftWithAI);
router.post('/public/:token', recommendationController.submitRecommendation); // can use token in body/params

// Protected routes
router.post('/request', auth, recommendationController.requestRecommendation);
router.get('/my', auth, recommendationController.getMyRequests);
router.put('/:id/publish', auth, recommendationController.togglePublish);

// For internal writers
router.post('/:id/draft', auth, recommendationController.draftWithAI);
router.post('/:id/submit', auth, recommendationController.submitRecommendation);

module.exports = router;
