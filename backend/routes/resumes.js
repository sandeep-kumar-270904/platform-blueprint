const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const resumeController = require('../controllers/resumeController');

// All resume routes require authentication
router.use(authMiddleware);

router.get('/', resumeController.getResumes);
router.post('/', resumeController.createResume);
router.get('/:id', resumeController.getResumeById);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/duplicate', resumeController.duplicateResume);
router.post('/:id/default', resumeController.setDefaultResume);
router.post('/:id/score', resumeController.scoreResume);
router.post('/:id/share', resumeController.toggleSharing);
router.post('/shared/:linkId', resumeController.getSharedResume);
router.post('/shared/:linkId/export', resumeController.trackPublicExport);
router.post('/:id/export', resumeController.trackExport);
router.get('/:id/versions', resumeController.getVersions);
router.post('/:id/versions/:vid/restore', resumeController.restoreVersion);

module.exports = router;
