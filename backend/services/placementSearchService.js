const PlacementSearchItem = require('../models/PlacementSearchItem');
const SearchQueryLog = require('../models/SearchQueryLog');

/**
 * Synchronize a document into the unified search index.
 * @param {string} moduleType - 'company', 'dsa', 'qa', 'group', etc.
 * @param {ObjectId} referenceId - The ID of the original document
 * @param {Object} data - Contains title, description, matchTags, companyTags, visibility, allowedUsers
 */
async function syncItem(moduleType, referenceId, data) {
  try {
    await PlacementSearchItem.updateOne(
      { moduleType, referenceId },
      { 
        $set: {
          title: data.title,
          description: data.description || '',
          matchTags: data.matchTags || [],
          companyTags: data.companyTags || [],
          visibility: data.visibility || 'Public',
          allowedUsers: data.allowedUsers || []
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(`Error syncing search item [${moduleType}:${referenceId}]:`, error);
  }
}

/**
 * Remove an item from the unified search index.
 */
async function removeItem(moduleType, referenceId) {
  try {
    await PlacementSearchItem.deleteOne({ moduleType, referenceId });
  } catch (error) {
    console.error(`Error removing search item [${moduleType}:${referenceId}]:`, error);
  }
}

/**
 * Compute trending searches (cached/aggregated).
 * Requires queries to come from at least 2 distinct users to prevent bot spam.
 */
async function getTrendingSearches() {
  try {
    // 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await SearchQueryLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { 
        $group: { 
          _id: "$query", 
          count: { $sum: 1 }, 
          uniqueUsers: { $addToSet: "$user_id" } 
        } 
      },
      { 
        $project: {
          query: "$_id",
          count: 1,
          uniqueUserCount: { $size: "$uniqueUsers" }
        }
      },
      // Filter out spam (needs at least 2 distinct users)
      { $match: { uniqueUserCount: { $gte: 2 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return trending.map(t => t.query);
  } catch (error) {
    console.error("Error computing trending searches:", error);
    return [];
  }
}

module.exports = {
  syncItem,
  removeItem,
  getTrendingSearches
};
