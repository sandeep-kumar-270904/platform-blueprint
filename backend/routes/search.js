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

    const Course = require('../models/Course');
    const LearningPath = require('../models/LearningPath');

    const [colleges, events, courses, paths] = await Promise.all([
      College.find({
        $or: [
          { name: regex },
          { 'location.city': regex },
          { 'location.state': regex }
        ]
      })
      .select('name location imageUrl rating type')
      .limit(5),

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
      .limit(5),

      Course.find({
        $or: [
          { title: regex },
          { tags: regex },
          { category: regex },
          { provider: regex }
        ]
      })
      .select('title provider thumbnailImage category level')
      .limit(5),

      LearningPath.find({
        $or: [
          { title: regex },
          { category: regex }
        ]
      })
      .select('title thumbnailImage category level')
      .limit(3)
    ]);

    // Combine courses and paths into one results array for the frontend "Courses" section
    const combinedCourses = [
      ...courses.map(c => ({ ...c.toObject(), searchType: 'course' })),
      ...paths.map(p => ({ ...p.toObject(), searchType: 'path' }))
    ];

    res.json({ colleges, events, courses: combinedCourses });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error during search' });
  }
});

module.exports = router;
