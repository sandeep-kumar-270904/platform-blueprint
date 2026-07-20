const express = require('express');
const router = express.Router();
const altFundingController = require('../controllers/altFundingController');

// Public facing route
// EXPLICITLY DOCUMENTED: This data is 100% admin-curated.
// There is no scraper, crawler, or scheduled fetch job anywhere touching this endpoint or model.
router.get('/', altFundingController.getPublicResources);

module.exports = router;
