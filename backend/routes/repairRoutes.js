const express = require('express');
const { getProviders, getProviderById, getReviews, addReview, markReviewHelpful, flagReview, getCompareProviders, createRequest, getMyRequests, cancelRequest, addRequestNote, reportProvider, updateRequestStatus, toggleSaveProvider, getSavedProviders, getRecommendations, getDashboardSummary, dismissReviewPrompt, getUrgencyConfig, submitProviderApplication, getProviderSlots, createQuoteRequest, getMyQuoteRequests, cancelQuoteRequest, closeQuoteRequest, acceptQuoteResponse, getRebookData, exportRepairData, updateReview, deleteReview, getAdminProviders, verifyProvider, getAdminReports, resolveReport } = require('../controllers/repairController');
const { protect, optionalAuth } = require('../middleware/auth');
const uploadRepairPhoto = require('../middleware/uploadRepairPhoto');

const router = express.Router();

const rateLimit = require('express-rate-limit');

// Rate limiting for anti-spam/abuse
const createRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many service requests created from this IP, please try again after 15 minutes.'
});

const quoteRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many quote requests created from this IP, please try again after 15 minutes.'
});

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 reviews per windowMs
  message: 'Too many reviews created from this IP, please try again after an hour.'
});

router.route('/')
  .get(optionalAuth, getProviders);

router.route('/export')
  .get(protect, exportRepairData);

router.route('/admin/providers')
  .get(protect, getAdminProviders); // Note: add admin middleware if available

router.route('/admin/providers/:id/verify')
  .put(protect, verifyProvider);

router.route('/admin/reports')
  .get(protect, getAdminReports);

router.route('/admin/reports/:id/resolve')
  .put(protect, resolveReport);

router.route('/compare')
  .get(optionalAuth, getCompareProviders);

router.route('/urgency-config')
  .get(getUrgencyConfig);

router.route('/applications')
  .post(optionalAuth, submitProviderApplication);

router.route('/dashboard')
  .get(protect, getDashboardSummary);

router.route('/saved')
  .get(protect, getSavedProviders);

router.route('/recommendations')
  .get(protect, getRecommendations);

router.route('/requests')
  .get(protect, getMyRequests)
  .post(protect, createRequestLimiter, uploadRepairPhoto.single('photo'), createRequest);

router.put('/requests/:id/cancel', protect, cancelRequest);
router.put('/requests/:id/note', protect, addRequestNote);
router.get('/requests/:id/rebook', protect, getRebookData);

router.route('/requests/:id/dismiss-prompt')
  .put(protect, dismissReviewPrompt);

router.route('/requests/:id/status')
  .put(protect, updateRequestStatus);

router.route('/quotes')
  .get(protect, getMyQuoteRequests)
  .post(protect, quoteRequestLimiter, uploadRepairPhoto.single('photo'), createQuoteRequest);

router.route('/quotes/:id/cancel')
  .put(protect, cancelQuoteRequest);

router.route('/quotes/:id/close')
  .put(protect, closeQuoteRequest);

router.route('/quotes/:quoteId/accept')
  .post(protect, acceptQuoteResponse);

module.exports = router;

router.route('/:id')
  .get(optionalAuth, getProviderById);

router.route('/:id/slots')
  .get(optionalAuth, getProviderSlots);

router.route('/:id/save')
  .post(protect, toggleSaveProvider);

router.route('/:id/report')
  .post(protect, reportProvider);

router.route('/:id/reviews')
  .get(getReviews)
  .post(protect, reviewLimiter, addReview);

router.route('/reviews/:id/helpful')
  .put(protect, markReviewHelpful);

router.route('/reviews/:id/flag')
  .put(protect, flagReview);

router.route('/reviews/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);
