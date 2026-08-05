const express = require('express');
const {
  getAdminProviders,
  createProvider,
  updateProvider,
  deactivateProvider,
  verifyProvider,
  getReports,
  updateReportStatus,
  hideReview,
  getAllRequests,
  getAnalytics
} = require('../controllers/adminRepairController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(admin);

// Providers Management
router.route('/providers')
  .get(getAdminProviders)
  .post(createProvider);

router.route('/providers/:id')
  .put(updateProvider);

router.route('/providers/:id/deactivate')
  .put(deactivateProvider);

router.route('/providers/:id/verify')
  .put(verifyProvider);

// Moderation Queue
router.route('/reports')
  .get(getReports);

router.route('/reports/:id/status')
  .put(updateReportStatus);

router.route('/reviews/:id/hide')
  .put(hideReview);

// Service Requests Oversight
router.route('/requests')
  .get(getAllRequests);

// Analytics
router.route('/analytics')
  .get(getAnalytics);

module.exports = router;
