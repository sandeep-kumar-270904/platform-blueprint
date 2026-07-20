const express = require('express');
const router = express.Router();
const savingsGoalController = require('../controllers/savingsGoalController');
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');

router.use(authMiddleware);

router.get('/', savingsGoalController.getSavingsGoal);
router.post('/', isNotBanned, savingsGoalController.upsertSavingsGoal);
router.patch('/', isNotBanned, savingsGoalController.updateSavingsGoal);

module.exports = router;
