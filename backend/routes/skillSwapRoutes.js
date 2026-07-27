const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const skillSwapController = require('../controllers/skillSwapController');
const skillSwapCirclesController = require('../controllers/skillSwapCirclesController');
const { actionRateLimiter, reviewLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// Offer Routes
router.route('/offers')
  .post(actionRateLimiter, skillSwapController.createOffer)
  .get(skillSwapController.getOffers);

router.get('/offers/mine', skillSwapController.getMyOffers);

router.route('/offers/:id')
  .get(skillSwapController.getOfferById)
  .patch(skillSwapController.updateOffer)
  .delete(skillSwapController.deleteOffer);

// Match Routes
router.get('/matches', skillSwapController.getMatches);
router.get('/recommendations', skillSwapController.getRecommendations);

// Request Routes
router.route('/requests')
  .post(actionRateLimiter, skillSwapController.createRequest)
  .get(skillSwapController.getRequests);

router.patch('/requests/:id', skillSwapController.updateRequestStatus);
router.patch('/requests/:id/schedule', skillSwapController.scheduleRequest);
router.patch('/requests/:id/complete', skillSwapController.completeSession);
router.patch('/requests/:id/cancel', skillSwapController.cancelRequest);
router.patch('/requests/:id/no-show', skillSwapController.markNoShow);

// Session & Review Routes
router.get('/sessions/mine', skillSwapController.getMySessions);
router.get('/sessions/:id/ics', skillSwapController.generateICS);
router.post('/sessions/:id/review', reviewLimiter, skillSwapController.leaveReview);
router.get('/users/me/export', skillSwapController.exportData);
router.get('/users/:id/reviews', skillSwapController.getUserReviews);
router.get('/users/:id/badges', skillSwapController.getUserBadges);

// Reports
router.post('/reports', actionRateLimiter, skillSwapController.createReport);

// Phase 9: Endorsements & Goals
router.post('/endorsements', actionRateLimiter, skillSwapController.createEndorsement);
router.get('/users/:id/endorsements', skillSwapController.getUserEndorsements);

router.post('/goals', actionRateLimiter, skillSwapController.createGoal);
router.get('/goals/mine', skillSwapController.getMyGoals);
router.get('/users/me/streak', skillSwapController.getMyStreak);
router.get('/notifications/digest', skillSwapController.getNotificationDigest);

// Circle Routes
router.route('/circles')
  .post(actionRateLimiter, skillSwapCirclesController.createCircle)
  .get(skillSwapCirclesController.getCircles);

router.get('/circles/recommended', skillSwapCirclesController.getRecommendedCircles);
router.get('/circles/mine', skillSwapCirclesController.getMyCircles);

router.route('/circles/:id')
  .get(skillSwapCirclesController.getCircleDetail)
  .patch(skillSwapCirclesController.editCircle)
  .delete(skillSwapCirclesController.cancelCircle);

router.post('/circles/:id/join', skillSwapCirclesController.joinCircle);
router.post('/circles/:id/leave', skillSwapCirclesController.leaveCircle);
router.patch('/circles/:id/sessions/:sessionId/complete', skillSwapCirclesController.completeSession);

module.exports = router;
