const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/careerSimulatorController');
const auth = require('../middleware/auth');

router.post('/simulate', auth, simulatorController.simulatePath);

module.exports = router;
