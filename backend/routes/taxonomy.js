const express = require('express');
const router = express.Router();
const { getTaxonomies } = require('../controllers/taxonomyController');

router.get('/', getTaxonomies);

module.exports = router;
