const express = require('express');
const router = express.Router();
const scholarshipController = require('../controllers/scholarshipController');
const protect = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const multer = require('multer');

// Configure Multer for document uploads (Phase 8: File Upload Validation)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/scholarships/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'), false);
    }
  }
});

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Public / User routes
router.get('/', scholarshipController.getScholarships);
router.get('/saved', protect, scholarshipController.getSavedScholarships);
router.get('/applications', protect, scholarshipController.getApplications);
router.get('/my-submitted', protect, scholarshipController.getMySubmitted);
router.get('/matched', protect, scholarshipController.getMatchedScholarships);
router.get('/:id', scholarshipController.getScholarshipDetails);

router.post('/:id/apply', protect, scholarshipController.initiateApplication);
router.post('/:id/track-external-click', protect, async (req, res) => {
  try {
    const ScholarshipApplication = require('../models/ScholarshipApplication');
    let app = await ScholarshipApplication.findOne({ userId: req.user.id, scholarshipId: req.params.id });
    if (!app) {
      app = await ScholarshipApplication.create({ userId: req.user.id, scholarshipId: req.params.id, status: 'link_opened' });
    }
    res.json(app);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

router.patch('/applications/:appId', protect, scholarshipController.updateApplicationDraft);
router.post('/applications/:appId/submit', protect, scholarshipController.submitApplication);
router.patch('/applications/:appId/status', protect, scholarshipController.updateExternalApplicationStatus);
router.post('/applications/:appId/upload', protect, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, scholarshipController.uploadDocument);

router.post('/:id/save', protect, isNotBanned, scholarshipController.toggleSave);
router.post('/:id/match-explanation', protect, scholarshipController.getMatchExplanation);
const scholarshipReviewController = require('../controllers/scholarshipReviewController');
router.post('/:id/report', protect, scholarshipController.reportScholarship);
router.post('/:id/reviews', protect, isNotBanned, scholarshipReviewController.addScholarshipReview);

// Submissions (Verified Orgs / Users)
router.post('/', protect, isNotBanned, scholarshipController.submitScholarship);

const rateLimit = require('express-rate-limit');
const userSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each user to 5 submissions per day
  message: { message: 'Too many submissions. Please try again tomorrow.' }
});

router.post('/submit-user-found', protect, isNotBanned, userSubmissionLimiter, scholarshipController.submitUserFound);

// Phase 2: Dashboard & Preferences
router.get('/my-dashboard', protect, scholarshipController.getDashboard);
router.get('/my-dashboard/calendar', protect, scholarshipController.getCalendar);
router.get('/reminder-preferences', protect, scholarshipController.getReminderPreferences);
router.patch('/reminder-preferences', protect, scholarshipController.updateReminderPreferences);

// Phase 2: Calculator
router.post('/calculate-aid', protect, scholarshipController.calculateAid);

// Phase 2: Recommendation Letters (within application flow)
router.get('/applications/:appId/available-letters', protect, scholarshipController.getAvailableLetters);
router.post('/applications/:appId/letter', protect, scholarshipController.attachLetter);

// Admin review routes
router.get('/admin/pending', protect, checkRole(['admin', 'moderator']), scholarshipController.getPendingReviews);
router.get('/admin/pending-lightweight', protect, checkRole(['admin', 'moderator']), scholarshipController.getPendingLightweight);
router.post('/admin/:id/approve', protect, checkRole(['admin', 'moderator']), scholarshipController.approveScholarship);
router.post('/admin/:id/reject', protect, checkRole(['admin', 'moderator']), scholarshipController.rejectScholarship);

// Admin Analytics (Phase 2 Granular)
router.get('/admin/analytics', protect, checkRole(['admin', 'moderator']), scholarshipController.getAdminAnalytics);
router.get('/admin/analytics/funnel', protect, checkRole(['admin', 'moderator']), scholarshipController.getAnalyticsFunnel);
router.get('/admin/analytics/categories', protect, checkRole(['admin', 'moderator']), scholarshipController.getAnalyticsCategories);
router.get('/admin/analytics/source-comparison', protect, checkRole(['admin', 'moderator']), scholarshipController.getAnalyticsSourceComparison);
router.get('/admin/analytics/flags', protect, checkRole(['admin', 'moderator']), scholarshipController.getAnalyticsFlags);

// Regional Hub
router.get('/regional/near-you', scholarshipController.getRegionalNearYou);

module.exports = router;
