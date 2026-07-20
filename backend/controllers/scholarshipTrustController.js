const ScholarshipReview = require('../models/ScholarshipReview');
const AwardeeStory = require('../models/AwardeeStory');

exports.getCommunityTrust = async (req, res) => {
  try {
    const scholarshipId = req.params.id;

    // Aggregate reviews
    const reviewStats = await ScholarshipReview.aggregate([
      { $match: { scholarshipId: require('mongoose').Types.ObjectId(scholarshipId), isAuthentic: true } },
      { 
        $group: {
          _id: null,
          reviewCount: { $sum: 1 },
          averageRating: { $avg: "$rating" }
        }
      }
    ]);

    const reviewCount = reviewStats.length > 0 ? reviewStats[0].reviewCount : 0;
    const averageRating = reviewStats.length > 0 ? (Math.round(reviewStats[0].averageRating * 10) / 10) : 0;

    // Aggregate verified awardee stories
    // Since AwardeeStory references applicationId, we need to lookup ScholarshipApplication
    // Or, we can just assume AwardeeStory might have scholarshipId directly.
    // Wait, AwardeeStory schema uses `applicationId`. Let's populate or aggregate with lookup.
    const storyStats = await AwardeeStory.aggregate([
      { $match: { status: 'approved' } },
      {
        $lookup: {
          from: 'scholarshipapplications',
          localField: 'applicationId',
          foreignField: '_id',
          as: 'app'
        }
      },
      { $unwind: "$app" },
      { $match: { "app.scholarshipId": require('mongoose').Types.ObjectId(scholarshipId) } },
      {
        $group: {
          _id: null,
          confirmedAwardeeCount: { $sum: 1 }
        }
      }
    ]);

    const confirmedAwardeeCount = storyStats.length > 0 ? storyStats[0].confirmedAwardeeCount : 0;

    // Compute trustLevel based on strict thresholds
    let trustLevel = 'emerging';
    if (reviewCount >= 10 && averageRating >= 4.0 && confirmedAwardeeCount >= 2) {
      trustLevel = 'well_reviewed';
    } else if (reviewCount >= 3 || confirmedAwardeeCount >= 1) {
      trustLevel = 'established';
    }

    res.json({
      reviewCount,
      averageRating,
      confirmedAwardeeCount,
      trustLevel
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
