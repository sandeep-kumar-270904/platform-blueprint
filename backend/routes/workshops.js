const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const auth = require('../middleware/auth');

router.get('/', auth, workshopController.listWorkshops);
router.post('/', auth, workshopController.createWorkshop);
router.post('/:id/join', auth, workshopController.joinWorkshop);
router.post('/:id/share', auth, workshopController.shareResume);
router.get('/:id', auth, workshopController.getWorkshopDetails);

module.exports = router;
