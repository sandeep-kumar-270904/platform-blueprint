const express = require('express');
const router = express.Router();
const negotiationController = require('../controllers/negotiationController');
const protect = require('../middleware/auth');

router.use(protect);

router.post('/generate', negotiationController.getSalaryInsightsAndNegotiation);

module.exports = router;
