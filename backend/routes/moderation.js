const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const moderationController = require('../controllers/moderationController');

router.use(auth);

// All users can report content
router.post('/reports', moderationController.createReport);

// Admin-only middleware inline
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

router.get('/reports', isAdmin, moderationController.getReports);
router.post('/reports/:id/action', isAdmin, moderationController.actionReport);

module.exports = router;
