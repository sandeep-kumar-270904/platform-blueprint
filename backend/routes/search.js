const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Event = require('../models/Event');

// GET /api/search?q=query
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.json({ colleges: [], events: [] });
    }

    // Escape regex
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeQuery, 'i');

    const [colleges, events] = await Promise.all([
      College.find({
        $or: [
          { name: regex },
          { 'location.city': regex },
          { 'location.state': regex }
        ]
      })
      .select('name location imageUrl rating type')
      .limit(10),

      Event.find({
        status: 'approved',
        $or: [
          { title: regex },
          { tags: regex },
          { eventType: regex },
          { venue: regex }
        ]
      })
      .populate('hostCollegeId', 'name')
      .limit(10)
    ]);

    res.json({ colleges, events });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error during search' });
  }
});

module.exports = router;
