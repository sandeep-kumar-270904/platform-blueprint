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

module.exports = router;
