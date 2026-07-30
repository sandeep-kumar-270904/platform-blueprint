const express = require('express');
const { getProviders, getProviderById, getReviews, addReview, markReviewHelpful, flagReview, getCompareProviders, createRequest, getMyRequests, cancelRequest, addRequestNote, reportProvider, updateRequestStatus, toggleSaveProvider, getSavedProviders, getRecommendations, getDashboardSummary, dismissReviewPrompt } = require('../controllers/repairController');
const { protect, optionalAuth } = require('../middleware/auth');
const uploadRepairPhoto = require('../middleware/uploadRepairPhoto');

const router = express.Router();

router.route('/')
  .get(optionalAuth, getProviders);

router.route('/compare')
  .get(optionalAuth, getCompareProviders);

router.route('/dashboard')
  .get(protect, getDashboardSummary);

router.route('/saved')
  .get(protect, getSavedProviders);

router.route('/recommendations')
  .get(protect, getRecommendations);

router.route('/requests')
  .get(protect, getMyRequests)
  .post(protect, uploadRepairPhoto.single('photo'), createRequest);

router.route('/requests/:id/cancel')
  .put(protect, cancelRequest);

router.route('/requests/:id/note')
  .put(protect, addRequestNote);

router.route('/requests/:id/dismiss-prompt')
  .put(protect, dismissReviewPrompt);

router.route('/requests/:id/status')
  .put(protect, updateRequestStatus);

module.exports = router;

router.route('/:id')
  .get(optionalAuth, getProviderById);

router.route('/:id/save')
  .post(protect, toggleSaveProvider);

router.route('/:id/report')
  .post(protect, reportProvider);

router.route('/:id/reviews')
  .get(getReviews)
  .post(protect, addReview);

router.route('/reviews/:id/helpful')
  .put(protect, markReviewHelpful);

router.route('/reviews/:id/flag')
  .put(protect, flagReview);
