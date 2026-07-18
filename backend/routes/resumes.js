const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const resumeController = require('../controllers/resumeController');

// Multer config with limits
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOCX allowed.'));
    }
  }
});

// Rate limiter for shared links to prevent brute-forcing passwords
const shareLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 attempts per `window`
  message: { message: 'Too many requests, please try again later.' }
});

// Public routes (must be BEFORE authMiddleware)
router.post('/shared/:linkId', shareLinkLimiter, resumeController.getSharedResume);
router.post('/shared/:linkId/export', shareLinkLimiter, resumeController.trackPublicExport);
router.get('/shared/:linkId/qr', resumeController.getSharedResumeQR);

// All other resume routes require authentication
router.use(authMiddleware);

router.get('/insights', resumeController.getInsights);
router.get('/', resumeController.getResumes);

// Phase 8 Routes
router.get('/discovery', resumeController.getDiscoveryFeed);
router.post('/trigger-health-nudges', resumeController.triggerHealthNudges);
router.post('/:id/discovery-view', resumeController.trackDiscoveryView);
router.get('/:id/completeness', resumeController.getCompleteness);
router.post('/:id/translate', resumeController.translateResume);

// Phase 16: Backup
router.post('/backup/settings', resumeController.updateBackupSettings);
router.get('/backup/download', resumeController.downloadFullBackup);

router.post('/', resumeController.createResume);
router.post('/import/file', upload.single('file'), resumeController.importFromFile);
router.get('/:id', resumeController.getResumeById);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/duplicate', resumeController.duplicateResume);
router.post('/:id/tailor', resumeController.tailorResume);
router.post('/:id/linkedin-export', resumeController.exportLinkedIn);
router.post('/:id/default', resumeController.setDefaultResume);
router.post('/:id/score', resumeController.scoreResume);
router.post('/:id/share', resumeController.toggleSharing);
router.post('/:id/export', resumeController.trackExport);
router.get('/:id/export/:format', resumeController.exportFormat);
router.get('/:id/versions', resumeController.getVersions);
router.post('/:id/versions/:vid/restore', resumeController.restoreVersion);


router.post('/:id/edit-propose', resumeController.proposeResumeEdit);


// Phase 10
router.get('/insights/benchmark', auth, resumeController.getIndustryBenchmark);
router.put('/:id/archive', auth, resumeController.archiveResume);
router.put('/:id/restore', auth, resumeController.unarchiveResume);

router.post('/:id/narrative', auth, resumeController.generateNarrative);


// POST /api/resumes/:id/panic-rebuild
router.post('/:id/panic-rebuild', authMiddleware, resumeController.panicRebuild);

// Phase 16: Anonymization
router.post('/:id/export/anonymous', authMiddleware, resumeController.exportAnonymousVariant);

module.exports = router;
