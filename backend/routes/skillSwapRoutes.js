const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const skillSwapController = require('../controllers/skillSwapController');

// All routes require authentication
router.use(protect);

// Offer Routes
router.route('/offers')
  .post(skillSwapController.createOffer)
  .get(skillSwapController.getOffers);

router.get('/offers/mine', skillSwapController.getMyOffers);

router.route('/offers/:id')
  .get(skillSwapController.getOfferById)
  .patch(skillSwapController.updateOffer)
  .delete(skillSwapController.deleteOffer);

// Match Routes
router.get('/matches', skillSwapController.getMatches);

// Request Routes
router.route('/requests')
  .post(skillSwapController.createRequest)
  .get(skillSwapController.getRequests);

router.patch('/requests/:id', skillSwapController.updateRequestStatus);
router.patch('/requests/:id/schedule', skillSwapController.scheduleRequest);
router.patch('/requests/:id/complete', skillSwapController.completeSession);
router.patch('/requests/:id/cancel', skillSwapController.cancelRequest);

// Session & Review Routes
router.get('/sessions/mine', skillSwapController.getMySessions);
router.post('/sessions/:id/review', skillSwapController.leaveReview);
router.get('/users/:id/reviews', skillSwapController.getUserReviews);

module.exports = router;
