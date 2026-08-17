const mongoose = require('mongoose');
const Review = require('../models/Review');
const College = require('../models/College');

const cats = ['academics', 'placements', 'faculty', 'infrastructure', 'hostel', 'campusLife', 'valueForMoney'];

/**
 * Calculates student experience aggregation for one or multiple colleges.
 * @param {string|mongoose.Types.ObjectId} [collegeId] - Optional college ID to filter. If omitted, calculates for all colleges.
 * @returns {Array|Object} Returns an array of results if collegeId is omitted, or a single object if collegeId is provided.
 */
async function aggregateCollegeReviews(collegeId = null) {
  const matchStage = { status: 'public' };
  if (collegeId) {
    matchStage.collegeId = new mongoose.Types.ObjectId(collegeId);
  }

  const aggResult = await Review.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$collegeId',
        ...cats.reduce((acc, cat) => {
          acc[`${cat}Sum`] = { $sum: { $ifNull: [`$categoryRatings.${cat}`, 0] } };
          acc[`${cat}Count`] = {
            $sum: { $cond: [{ $gt: [`$categoryRatings.${cat}`, 0] }, 1, 0] }
          };
          return acc;
        }, {})
      }
    }
  ]);

  const mapResult = (data) => {
    const studentExperience = {};
    cats.forEach(cat => {
      const count = data[`${cat}Count`] || 0;
      const sum = data[`${cat}Sum`] || 0;
      let confidence = 'low';
      if (count >= 20) confidence = 'high';
      else if (count >= 5) confidence = 'medium';

      studentExperience[cat] = {
        avgRating: count > 0 ? Math.round((sum / count) * 10) / 10 : null,
        sampleSize: count,
        confidence
      };
    });
    return { collegeId: data._id, studentExperience };
  };

  if (collegeId) {
    if (aggResult.length > 0) {
      return mapResult(aggResult[0]).studentExperience;
    }
    // Return empty state if no reviews
    const emptyExperience = {};
    cats.forEach(cat => {
      emptyExperience[cat] = { avgRating: null, sampleSize: 0, confidence: 'low' };
    });
    return emptyExperience;
  }

  return aggResult.map(mapResult);
}

module.exports = { aggregateCollegeReviews, cats };
