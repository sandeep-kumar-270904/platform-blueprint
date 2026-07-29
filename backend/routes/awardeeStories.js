const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const awardeeStoryController = require('../controllers/awardeeStoryController');

const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

router.use(authMiddleware);

router.post('/', isNotBanned, awardeeStoryController.createStory);
router.get('/mine', awardeeStoryController.getMyStories);
router.patch('/:id', isNotBanned, awardeeStoryController.updateStory);

// Admin Routes
router.get('/admin/pending', checkRole(['admin', 'moderator']), awardeeStoryController.getPendingStories);
router.post('/:id/approve', isNotBanned, checkRole(['admin', 'moderator']), awardeeStoryController.approveStory);
router.post('/:id/reject', isNotBanned, checkRole(['admin', 'moderator']), awardeeStoryController.rejectStory);

module.exports = router;
