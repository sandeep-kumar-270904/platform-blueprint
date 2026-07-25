const express = require('express');
const router = express.Router();
const VirtualClassroom = require('../models/VirtualClassroom');

// GET /api/integration/classrooms - Public API for external integration
router.get('/classrooms', async (req, res) => {
  try {
    // API Key validation would go here.
    
    const classrooms = await VirtualClassroom.find({ 
      status: { $in: ['scheduled', 'live'] },
      is_deleted: false,
      privacy: 'public'
    }).select('title description scheduled_at duration_minutes host_name type max_participants current_participants status _id');
    
    res.json({
      success: true,
      data: classrooms
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
