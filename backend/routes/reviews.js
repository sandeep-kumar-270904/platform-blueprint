const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const College = require('../models/College');
const auth = require('../middleware/auth');

// Helper to recalculate college rating
const recalculateCollegeRating = async (collegeId) => {
  const college = await College.findById(collegeId);
  if (!college) return;

  const allReviews = await Review.find({ collegeId, status: 'public' });
  college.totalReviews = allReviews.length;
  
  if (college.totalReviews > 0) {
    college.rating = Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / college.totalReviews) * 10) / 10;
    const cats = ['hostel', 'labs', 'faculty', 'campusLife', 'placements', 'academics', 'infrastructure'];
    cats.forEach(cat => {
      let catSum = 0;
      let catCount = 0;
      allReviews.forEach(r => {
        if (r.categoryRatings && r.categoryRatings[cat]) {
          catSum += r.categoryRatings[cat];
          catCount++;
        }
      });
      college[`avg${cat.charAt(0).toUpperCase() + cat.slice(1)}Rating`] = catCount > 0 ? Math.round((catSum / catCount) * 10) / 10 : 0;
    });
  } else {
    college.rating = 0;
    const cats = ['hostel', 'labs', 'faculty', 'campusLife', 'placements', 'academics', 'infrastructure'];
    cats.forEach(cat => {
      college[`avg${cat.charAt(0).toUpperCase() + cat.slice(1)}Rating`] = 0;
    });
  }
  
  await college.save();
};

// POST /api/reviews/:id/report - Report a review
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Check if user already reported this review
    const alreadyReported = review.flagReasons.some(
      flag => flag.reportedBy && flag.reportedBy.toString() === req.user.id
    );

    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }

    review.flagReasons.push({
      reason,
      reportedBy: req.user.id
    });
    review.flaggedCount += 1;

    // Auto-hide if flagged >= 5
    if (review.flaggedCount >= 5) {
      review.status = 'hidden';
    }

    await review.save();
    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reporting review', error: error.message });
  }
});

// PUT /api/reviews/:id - Edit a review (author only)
router.put('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Check ownership
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this review' });
    }

    const { reviewText, rating, categoryRatings } = req.body;
    
    let overallRating = rating || review.rating;
    
    if (categoryRatings) {
      const cats = ['hostel', 'labs', 'faculty', 'campusLife', 'placements', 'academics', 'infrastructure'];
      let sum = 0;
      let count = 0;
      cats.forEach(c => {
        if (categoryRatings[c]) {
          sum += categoryRatings[c];
          count++;
        }
      });
      if (count > 0) overallRating = Math.round((sum / count) * 10) / 10;
    }

    review.reviewText = reviewText !== undefined ? reviewText : review.reviewText;
    review.rating = overallRating;
    if (categoryRatings) review.categoryRatings = categoryRatings;

    await review.save();
    await recalculateCollegeRating(review.collegeId);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
});

// DELETE /api/reviews/:id - Delete a review (author only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Check ownership (or could add admin check if needed)
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const collegeId = review.collegeId;
    await Review.findByIdAndDelete(req.params.id);
    await recalculateCollegeRating(collegeId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});
module.exports = router;
