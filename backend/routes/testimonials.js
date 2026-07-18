const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const auth = require('../middleware/auth');

// Public route for submitting via token
router.get('/public/:token', testimonialController.getTestimonialByToken);
router.post('/public/:token', testimonialController.submitTestimonialPublic);

// Protected routes
router.post('/request', auth, testimonialController.requestTestimonial);
router.get('/my', auth, testimonialController.getFreelancerTestimonials);
router.put('/:id/review', auth, testimonialController.reviewTestimonial);

module.exports = router;
