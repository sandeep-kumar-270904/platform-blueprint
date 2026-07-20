const express = require('express');
const router = express.Router();
const scholarshipTrustController = require('../controllers/scholarshipTrustController');

// GET /api/scholarships/:id/community-trust (We'll mount this in server.js or inside scholarships.js)
// If mounted in server.js as /api/scholarships, we can do router.get('/:id/community-trust')

router.get('/:id/community-trust', scholarshipTrustController.getCommunityTrust);

module.exports = router;
