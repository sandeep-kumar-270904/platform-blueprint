const express = require('express');
const router = express.Router();
const successStoryController = require('../controllers/successStoryController');
const auth = require('../middleware/auth');
const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public routes
router.get('/public', successStoryController.getPublicStories);

// User routes
router.use(auth);
router.get('/my-stories', successStoryController.getMyStories);
router.post('/', successStoryController.createStory);
router.put('/:id', successStoryController.updateStory);
router.post('/polish', successStoryController.polishStory);

// Admin routes
router.get('/admin/pending', requireAdmin, successStoryController.getPendingStories);
router.put('/admin/:id/approve', requireAdmin, successStoryController.approveStory);

module.exports = router;
