const express = require('express');
const router = express.Router();
const essayTemplateController = require('../controllers/essayTemplateController');
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');

// Public route (auth can be optional but we assume authenticated for platform usage)
// We'll keep it public-facing but maybe require auth for the endpoint to match the prompt "any authenticated user"
router.get('/', authMiddleware, essayTemplateController.getPublicTemplates);

router.use(authMiddleware);

router.patch('/:id/publish', isNotBanned, essayTemplateController.publishTemplate);
router.delete('/:id', isNotBanned, essayTemplateController.deleteTemplate);

module.exports = router;
