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
    const Idea = require('../models/Idea');
    const BrainstormSession = require('../models/BrainstormSession');
    const IdeaCircle = require('../models/IdeaCircle');
    const User = require('../models/User');
    const CommunityPost = require('../models/CommunityPost');
    const RepairProvider = require('../models/RepairProvider');
    const RoommateProfile = require('../models/RoommateProfile');
    const RoommateGroup = require('../models/RoommateGroup');

    const [colleges, events, courses, paths, ideas, brainstorms, ideaCircles, users, posts, matchedTags, providers, roommateProfiles, roommateGroups] = await Promise.all([
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
      .limit(3),

      Idea.find({
        is_public: true,
        $or: [
          { title: regex },
          { description: regex },
          { category: regex }
        ]
      })
      .select('title description category status upvoteCount commentCount')
      .limit(5),

      BrainstormSession.find({
        status: 'open',
        $or: [
          { title: regex },
          { description: regex },
          { category: regex }
        ]
      })
      .select('title description category status')
      .limit(5),

      IdeaCircle.find({
        isPrivate: false,
        $or: [
          { name: regex },
          { description: regex },
          { category: regex }
        ]
      })
      .select('name description category isPrivate')
      .limit(5),

      User.find({
        $or: [
          { username: regex },
          { full_name: regex }
        ]
      })
      .select('username full_name avatar_url role')
      .limit(5),
      
      CommunityPost.find({
        status: { $nin: ['hidden', 'deleted', 'pending_review'] },
        $or: [
          { content: regex },
          { tags: regex }
        ]
      })
      .select('content tags like_count user_id createdAt')
      .populate('user_id', 'full_name username avatar_url')
      .sort({ createdAt: -1 })
      .limit(5),
      
      CommunityPost.distinct('tags', { tags: regex, status: { $nin: ['hidden', 'deleted', 'pending_review'] } }),
      
      RepairProvider.find({
        isActive: true,
        $or: [
          { name: regex },
          { category: regex },
          { 'services.name': regex }
        ]
      })
      .select('name category imageUrl location rating')
      .limit(5),

      RoommateProfile.find({
        status: 'active',
        isPaused: false,
        isHidden: false
      })
      .populate({
        path: 'user',
        match: { $or: [{ name: regex }, { full_name: regex }] },
        select: 'name full_name avatar_url profilePicture'
      })
      .limit(10), // Will filter out null users in JS

      RoommateGroup.find({
        status: 'active',
        $or: [
          { name: regex },
          { description: regex }
        ]
      })
      .select('name description targetSize status')
      .limit(5)
    ]);

    // Clean up populated profiles
    const filteredProfiles = roommateProfiles
      .filter(p => p.user != null) // Keep only those where the user matched
      .slice(0, 5) // Limit to 5
      .map(p => ({
        _id: p._id,
        bio: p.bio,
        budgetRange: p.budgetRange,
        user: p.user
      }));

    // Combine courses and paths into one results array for the frontend "Courses" section
    const combinedCourses = [
      ...courses.map(c => ({ ...c.toObject(), searchType: 'course' })),
      ...paths.map(p => ({ ...p.toObject(), searchType: 'path' }))
    ];

    res.json({ 
      colleges, events, courses: combinedCourses, ideas, brainstorms, 
      ideaCircles, users, posts, tags: matchedTags.slice(0, 5), providers,
      roommateProfiles: filteredProfiles,
      roommateGroups
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error during search' });
  }
});

module.exports = router;
