const cron = require('node-cron');
const Review = require('../models/Review');
const ReviewFlag = require('../models/ReviewFlag');
const User = require('../models/User');
const mongoose = require('mongoose');
const stringSimilarity = require('string-similarity');

const detectFraudulentReviews = async () => {
  console.log('Running Fraud Detection Job for Reviews...');
  
  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  try {
    // 1. duplicate_device (3+ reviews for same college from same ipAddress in 24h)
    const duplicateDevices = await Review.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo }, ipAddress: { $exists: true, $ne: null } } },
      { $group: { _id: { collegeId: "$collegeId", ipAddress: "$ipAddress" }, count: { $sum: 1 }, reviews: { $push: "$_id" } } },
      { $match: { count: { $gte: 3 } } }
    ]);
    
    for (const suspect of duplicateDevices) {
      for (const reviewId of suspect.reviews) {
        const existingFlag = await ReviewFlag.findOne({ reviewId, reason: 'duplicate_device' });
        if (!existingFlag) {
          await ReviewFlag.create({
            reviewId,
            collegeId: suspect._id.collegeId,
            reason: 'duplicate_device',
            severity: 'high'
          });
        }
      }
    }
    
    // 2. similar_text (>80% similarity for same college in 7 days)
    const newReviews = await Review.find({ createdAt: { $gte: oneDayAgo } });
    const collegeReviewsCache = {};
    for (const newReview of newReviews) {
      if (!newReview.reviewText) continue;
      
      const collegeId = newReview.collegeId.toString();
      if (!collegeReviewsCache[collegeId]) {
        collegeReviewsCache[collegeId] = await Review.find({ 
          collegeId: newReview.collegeId, 
          createdAt: { $gte: sevenDaysAgo } 
        });
      }
      
      const pastReviews = collegeReviewsCache[collegeId];
      
      for (const pastReview of pastReviews) {
        // Skip self
        if (pastReview._id.toString() === newReview._id.toString()) continue;
        if (!pastReview.reviewText) continue;
        
        const similarity = stringSimilarity.compareTwoStrings(newReview.reviewText, pastReview.reviewText);
        if (similarity > 0.80) {
          const existingFlag = await ReviewFlag.findOne({ reviewId: newReview._id, reason: 'similar_text' });
          if (!existingFlag) {
            await ReviewFlag.create({
              reviewId: newReview._id,
              collegeId: newReview.collegeId,
              reason: 'similar_text',
              severity: 'high'
            });
          }
          break; // One match is enough to flag newReview
        }
      }
    }
    
    // 3. rating_spike (5+ reviews for same college in 6h where overallRating is within 0.5 of each other)
    const collegeReviewCounts6h = await Review.aggregate([
      { $match: { createdAt: { $gte: sixHoursAgo } } },
      { $group: { _id: "$collegeId", count: { $sum: 1 }, reviews: { $push: "$$ROOT" } } },
      { $match: { count: { $gte: 5 } } }
    ]);
    
    for (const suspect of collegeReviewCounts6h) {
      const reviews = suspect.reviews;
      const flaggedReviewIds = new Set();
      for (const r1 of reviews) {
        const rating1 = r1.overallRating || 0;
        const closeReviews = reviews.filter(r2 => {
          const rating2 = r2.overallRating || 0;
          return Math.abs(rating1 - rating2) <= 0.5;
        });
        
        if (closeReviews.length >= 5) {
          for (const closeReview of closeReviews) {
            const reviewStr = closeReview._id.toString();
            if (flaggedReviewIds.has(reviewStr)) continue;
            flaggedReviewIds.add(reviewStr);
            
            const existingFlag = await ReviewFlag.findOne({ reviewId: closeReview._id, reason: 'rating_spike' });
            if (!existingFlag) {
              await ReviewFlag.create({
                reviewId: closeReview._id,
                collegeId: suspect._id,
                reason: 'rating_spike',
                severity: 'high'
              });
            }
          }
        }
      }
    }
    
    // 4. new_account (review.createdAt - user.created_at < 24 hours)
    const recentReviewsWithUser = await Review.find({ createdAt: { $gte: oneDayAgo } }).populate('userId', 'created_at');
    for (const review of recentReviewsWithUser) {
      if (review.userId && review.userId.created_at) {
        const reviewTime = review.createdAt.getTime();
        const userTime = new Date(review.userId.created_at).getTime();
        
        if (reviewTime - userTime < 24 * 60 * 60 * 1000) {
          const existingFlag = await ReviewFlag.findOne({ reviewId: review._id, reason: 'new_account' });
          if (!existingFlag) {
            await ReviewFlag.create({
              reviewId: review._id,
              collegeId: review.collegeId,
              reason: 'new_account',
              severity: 'medium'
            });
          }
        }
      }
    }

    // 5. Existing: review_burst
    const collegeReviewCounts1h = await Review.aggregate([
      { $match: { createdAt: { $gte: oneHourAgo } } },
      { $group: { _id: "$collegeId", count: { $sum: 1 }, reviews: { $push: "$_id" } } },
      { $match: { count: { $gt: 5 } } }
    ]);
    
    for (const suspect of collegeReviewCounts1h) {
      for (const reviewId of suspect.reviews) {
        const existingFlag = await ReviewFlag.findOne({ reviewId, reason: /burst/i });
        if (!existingFlag) {
          await ReviewFlag.create({
            reviewId,
            collegeId: suspect._id,
            reason: `College review burst: ${suspect.count} reviews in 1h`,
            severity: 'medium'
          });
        }
      }
    }

    // 6. Existing: Spam content
    const spamKeywords = ["buy followers", "crypto", "bitcoin", "investment", "click here", "http://", "https://"];
    for (const review of newReviews) {
      if (review.reviewText) {
        const text = review.reviewText.toLowerCase();
        const hasSpam = spamKeywords.some(keyword => text.includes(keyword));
        
        if (hasSpam) {
          const existingFlag = await ReviewFlag.findOne({ reviewId: review._id, reason: /spam content/i });
          if (!existingFlag) {
            await ReviewFlag.create({
              reviewId: review._id,
              collegeId: review.collegeId,
              reason: 'Spam content detected by keyword filter',
              severity: 'critical'
            });
          }
        }
      }
    }
    
    console.log('Fraud Detection Job completed.');
  } catch (err) {
    console.error('Error running Fraud Detection Job:', err);
  }
};

const startJob = () => {
  cron.schedule('0 * * * *', detectFraudulentReviews);
  console.log('Registered Review Fraud Detection cron job (runs every hour).');
};

module.exports = { detectFraudulentReviews, startJob };
