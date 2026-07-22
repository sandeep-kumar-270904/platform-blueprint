const express = require('express');
const router = express.Router();
const PlacementSearchItem = require('../models/PlacementSearchItem');
const SearchQueryLog = require('../models/SearchQueryLog');
const placementSearchService = require('../services/placementSearchService');
const authMiddleware = require('../middleware/auth');

// In-memory cache for trending searches
let cachedTrending = [];
let lastTrendingUpdate = 0;

// GET /api/placement-search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    
    // Minimum 2 characters threshold
    if (q.length < 2) {
      return res.json([]);
    }

    // Log the search (fire and forget)
    SearchQueryLog.create({
      user_id: req.user.id,
      query: q
    }).catch(err => console.error("Error logging search:", err));

    // Visibility filtering
    const visibilityFilter = {
      $and: [
        { visibility: { $ne: 'PendingReview' } },
        { 
          $or: [
            { visibility: 'Public' },
            { visibility: 'InviteOnly', allowedUsers: req.user.id }
          ]
        }
      ]
    };

    // Construct Text/Regex Match
    // We use a combination: text search if possible for ranking, or regex for partial matching
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexQuery = new RegExp(safeQuery, 'i');

    const matchQuery = {
      ...visibilityFilter,
      $or: [
        { title: regexQuery },
        { description: regexQuery },
        { matchTags: regexQuery },
        { companyTags: regexQuery }
      ]
    };

    // If text index is built, we could also use $text, but regex is better for partial matching of short terms
    // We will rank by exact title match first
    
    let results = await PlacementSearchItem.find(matchQuery)
      .limit(50)
      .lean();

    // Reasonably ranked: Exact title > Contains in title > Other
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const qLower = q.toLowerCase();

      const aExact = aTitle === qLower ? 2 : (aTitle.includes(qLower) ? 1 : 0);
      const bExact = bTitle === qLower ? 2 : (bTitle.includes(qLower) ? 1 : 0);
      
      return bExact - aExact; // Descending
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/placement-search/recent
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    // Get last 5 distinct searches for this user
    const logs = await SearchQueryLog.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    const uniqueSearches = [...new Set(logs.map(l => l.query))].slice(0, 5);
    res.json(uniqueSearches);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/placement-search/trending
router.get('/trending', async (req, res) => {
  try {
    const now = Date.now();
    // Cache for 10 minutes to avoid heavy aggregation on every load
    if (now - lastTrendingUpdate > 10 * 60 * 1000) {
      cachedTrending = await placementSearchService.getTrendingSearches();
      lastTrendingUpdate = now;
    }
    
    // Fallback if empty (e.g. fresh DB)
    if (cachedTrending.length === 0) {
      cachedTrending = ['Amazon OA', 'TCS NQT', 'Two Sum', 'Resume Tips'];
    }

    res.json(cachedTrending);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
