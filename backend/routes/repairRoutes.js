const express = require('express');
const { getProviders, getProviderById, getReviews, addReview, markReviewHelpful, flagReview } = require('../controllers/repairController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getProviders);

module.exports = router;


router.route('/:id')
  .get(getProviderById);

router.route('/:id/reviews')
  .get(getReviews)
  .post(protect, addReview);

router.route('/reviews/:id/helpful')
  .put(protect, markReviewHelpful);

router.route('/reviews/:id/flag')
  .put(protect, flagReview);
