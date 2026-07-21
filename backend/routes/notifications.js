const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// GET /api/notifications - Get logged-in user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Notification.countDocuments({ userId: req.user.id });
    
    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

// PUT /api/notifications/:id/read - Mark one as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

// PUT /api/notifications/read-all - Mark all as read (supports optional ?types= comma separated)
router.put('/read-all', auth, async (req, res) => {
  try {
    const query = { userId: req.user.id, isRead: false };
    
    if (req.query.types) {
      const typesArray = req.query.types.split(',').map(t => t.trim());
      query.type = { $in: typesArray };
    }
    
    await Notification.updateMany(
      query,
      { isRead: true }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
});

module.exports = router;
