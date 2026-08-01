const express = require('express');
const router = express.Router();
const roommateSuggestionsController = require('../controllers/roommateSuggestionsController');
const auth = require('../middleware/auth');
const checkSuspended = require('../middleware/checkSuspended');

// Route: /api/roommates/suggestions

router.get('/', auth, checkSuspended, roommateSuggestionsController.getSuggestions);
router.post('/dismiss', auth, checkSuspended, roommateSuggestionsController.dismissSuggestion);

module.exports = router;
