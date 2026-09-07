const express = require('express');
const router = express.Router();
const { 
  submitResource, 
  getResources, 
  getResourceById, 
  addReview, 
  reportResource 
} = require('../controllers/learningResourceController');
const auth = require('../middleware/auth'); // Uses existing auth middleware

// Public or standard GET routes
router.get('/', getResources);
router.get('/:id', getResourceById);

// Protected routes (requires authentication)
router.post('/', auth, submitResource);
router.post('/:id/reviews', auth, addReview);
router.post('/:id/report', auth, reportResource);

module.exports = router;
