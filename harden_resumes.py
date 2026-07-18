import os

file_path = "backend/routes/resumes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """const express = require('express');
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

// All other resume routes require authentication
router.use(authMiddleware);

router.get('/', resumeController.getResumes);
router.post('/', resumeController.createResume);
router.post('/import/file', upload.single('file'), resumeController.importFromFile);
router.get('/:id', resumeController.getResumeById);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/duplicate', resumeController.duplicateResume);
router.post('/:id/default', resumeController.setDefaultResume);
router.post('/:id/score', resumeController.scoreResume);
router.post('/:id/share', resumeController.toggleSharing);
router.post('/:id/export', resumeController.trackExport);
router.get('/:id/versions', resumeController.getVersions);
router.post('/:id/versions/:vid/restore', resumeController.restoreVersion);

module.exports = router;
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(replacement)

print("Hardened backend/routes/resumes.js")
