const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Review = require('../models/Review');
const User = require('../models/User');
const Notification = require('../models/Notification');
const CollegeQuestion = require('../models/CollegeQuestion');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/colleges/compare - Compare multiple colleges
router.get('/compare', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ message: 'No college IDs provided' });
    
    const idArray = ids.split(',').slice(0, 20); // Max 20
    const colleges = await College.find({ _id: { $in: idArray } });
    
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching colleges for comparison', error: error.message });
  }
});

// GET /api/colleges/saved/me - Get logged-in user's saved colleges
router.get('/saved/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedColleges');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.savedColleges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/colleges - List all colleges with search, filter, sort
router.get('/', async (req, res) => {
  try {
    const { search, type, feeRange, ratingMin, location, course, sort, page = 1, limit = 12 } = req.query;
    
    let query = { draft: { $ne: true } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }
    if (type && type !== 'All') query.type = type;
    if (ratingMin) query.rating = { $gte: parseFloat(ratingMin) };
    if (location && location !== 'All') query['location.state'] = location;
    if (course && course !== 'All') query['coursesOffered.name'] = { $regex: course, $options: 'i' };
    
    if (feeRange) {
      const [min, max] = feeRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        query['fees.tuition'] = { $gte: min, $lte: max };
      } else if (feeRange.endsWith('+')) {
        query['fees.tuition'] = { $gte: Number(feeRange.replace('+', '')) };
      }
    }

    let sortObj = { rating: -1 }; // default
    if (sort === 'fees-low') sortObj = { 'fees.tuition': 1 };
    if (sort === 'fees-high') sortObj = { 'fees.tuition': -1 };
    if (sort === 'name') sortObj = { name: 1 };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const colleges = await College.find(query).sort(sortObj).skip(skip).limit(parseInt(limit));
    const total = await College.countDocuments(query);

    res.json({
      colleges,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching colleges', error: error.message });
  }
});

// GET /api/colleges/personalization - Get personalized college rows
router.get('/personalization', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'viewedColleges.collegeId',
      model: 'College'
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recentlyViewed = user.viewedColleges
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .map(v => v.collegeId)
      .filter(c => c != null);

    // Rule-based logic for recommendations
    let recommended = [];
    
    // 1. Same Type/Location as viewed/saved
    const viewedTypes = [...new Set(recentlyViewed.map(c => c.type))];
    const viewedStates = [...new Set(recentlyViewed.map(c => c.location?.state).filter(Boolean))];

    if (viewedTypes.length > 0 || viewedStates.length > 0) {
      const matchQuery = { draft: { $ne: true }, _id: { $nin: recentlyViewed.map(c => c._id) } };
      const orConditions = [];
      if (viewedTypes.length > 0) orConditions.push({ type: { $in: viewedTypes } });
      if (viewedStates.length > 0) orConditions.push({ 'location.state': { $in: viewedStates } });
      
      if (orConditions.length > 0) {
         matchQuery.$or = orConditions;
      }

      recommended = await College.find(matchQuery).limit(8);
    }

    // 2. Fallback to top rated
    if (recommended.length < 4) {
      const fallback = await College.find({ 
        draft: { $ne: true }, 
        _id: { $nin: [...recentlyViewed.map(c=>c._id), ...recommended.map(c=>c._id)] }
      }).sort({ rating: -1 }).limit(8 - recommended.length);
      recommended = [...recommended, ...fallback];
    }

    // Assign generic reasons for simplicity
    const processedRecommended = recommended.map(c => {
      let matchReason = "Top Rated College";
      if (viewedTypes.includes(c.type)) matchReason = `Popular ${c.type} College`;
      else if (viewedStates.includes(c.location?.state)) matchReason = `Popular in ${c.location.state}`;
      
      return { ...c.toObject(), matchReason };
    });

    res.json({ recentlyViewed, recommended: processedRecommended });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching personalization', error: error.message });
  }
});

// POST /api/colleges/:id/view - Track viewed college
router.post('/:id/view', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove if already exists
    user.viewedColleges = user.viewedColleges.filter(v => v.collegeId.toString() !== req.params.id);
    
    // Add to front
    user.viewedColleges.unshift({ collegeId: req.params.id, viewedAt: new Date() });
    
    // Keep max 10
    if (user.viewedColleges.length > 10) {
      user.viewedColleges = user.viewedColleges.slice(0, 10);
    }

    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking view', error: error.message });
  }
});

// GET /api/colleges/:id/questions
router.get('/:id/questions', async (req, res) => {
  try {
    const { sort, status, page = 1, limit = 10 } = req.query;
    
    let query = { collegeId: req.params.id };
    if (status === 'unanswered') query.status = 'open';

    let sortObj = { createdAt: -1 };
    if (sort === 'upvotes') sortObj = { upvotes: -1, createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await CollegeQuestion.find(query)
      .populate('askedBy', 'full_name avatar_url')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await CollegeQuestion.countDocuments(query);

    res.json({
      questions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// POST /api/colleges/:id/questions
router.post('/:id/questions', auth, async (req, res) => {
  try {
    const { questionText } = req.body;
    if (!questionText) return res.status(400).json({ message: 'Question text is required' });

    const question = new CollegeQuestion({
      collegeId: req.params.id,
      askedBy: req.user.id,
      questionText
    });

    await question.save();
    
    // Return populated
    await question.populate('askedBy', 'full_name avatar_url');
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error posting question', error: error.message });
  }
});

// GET /api/colleges/:id - Get single college
router.get('/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching college', error: error.message });
  }
});

// POST /api/colleges - Any authenticated user add college
router.post('/', auth, async (req, res) => {
  try {
    const { name, location } = req.body;
    if (name && location) {
      const existing = await College.findOne({ name, 'location.city': location.city, 'location.state': location.state });
      if (existing) return res.status(400).json({ message: 'This college already exists in our database.' });
    }
    
    const user = await User.findById(req.user.id);
    const isAdmin = user && user.role === 'admin';
    
    const collegeData = req.body;
    if (!isAdmin) {
      collegeData.draft = true;
    }

    const college = new College(collegeData);
    await college.save();
    res.status(201).json(college);
  } catch (error) {
    res.status(400).json({ message: 'Error creating college', error: error.message });
  }
});

// PUT /api/colleges/:id - Admin edit college
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (error) {
    res.status(400).json({ message: 'Error updating college', error: error.message });
  }
});

// DELETE /api/colleges/:id - Admin delete college
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json({ message: 'College deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting college', error: error.message });
  }
});

// GET /api/colleges/:id/reviews - Get reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 5, sort = 'recent', verifiedFirst = 'false' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let sortObj = {};
    if (verifiedFirst === 'true') {
      sortObj.verificationStatus = -1; // 'verified' > 'unverified'
    }
    
    if (sort === 'helpful') sortObj.helpfulVotes = -1;
    else if (sort === 'highest') sortObj.rating = -1;
    else if (sort === 'lowest') sortObj.rating = 1;
    else sortObj.createdAt = -1; // recent

    const query = { collegeId: req.params.id, status: 'public' };

    const reviews = await Review.find(query)
      .populate('userId', 'username full_name avatar_url')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Review.countDocuments(query);

    // Calculate distribution (only public)
    const distribution = await Review.aggregate([
      { $match: { collegeId: new mongoose.Types.ObjectId(req.params.id), status: 'public' } },
      { $group: { _id: "$rating", count: { $sum: 1 } } }
    ]);
    
    const distMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => { distMap[d._id] = d.count; });

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      distribution: distMap
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// GET /api/colleges/:id/rating-breakdown
router.get('/:id/rating-breakdown', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    
    res.json({
      overall: college.rating,
      hostel: college.avgHostelRating,
      labs: college.avgLabsRating,
      faculty: college.avgFacultyRating,
      campusLife: college.avgCampusLifeRating,
      placements: college.avgPlacementsRating,
      academics: college.avgAcademicsRating,
      infrastructure: college.avgInfrastructureRating
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching breakdown', error: error.message });
  }
});

// POST /api/colleges/:id/reviews - Submit review
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });

    // Check if user already reviewed
    const existing = await Review.findOne({ collegeId: req.params.id, userId: req.user.id });
    if (existing) return res.status(400).json({ message: 'You have already reviewed this college' });

    const user = await User.findById(req.user.id);
    let verificationStatus = 'unverified';
    if (college.officialEmailDomain && user && user.email) {
      const userDomain = user.email.split('@')[1];
      if (userDomain === college.officialEmailDomain) {
        verificationStatus = 'verified';
      }
    }

    const { categoryRatings } = req.body;
    let overallRating = req.body.rating;
    
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

    const review = new Review({
      ...req.body,
      rating: overallRating,
      collegeId: req.params.id,
      userId: req.user.id,
      verificationStatus,
      verificationMethod: verificationStatus === 'verified' ? 'domain_match' : undefined
    });
    await review.save();

    // Update college rating
    const allReviews = await Review.find({ collegeId: req.params.id, status: 'public' });
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
    }
    
    await college.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: 'Error submitting review', error: error.message });
  }
});

// POST /api/colleges/:id/save - Bookmark college
router.post('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.savedColleges.includes(req.params.id)) {
      user.savedColleges.push(req.params.id);
      await user.save();
    }
    
    res.json({ message: 'College saved successfully', savedColleges: user.savedColleges });
  } catch (error) {
    res.status(500).json({ message: 'Error saving college', error: error.message });
  }
});

// DELETE /api/colleges/:id/save - Unbookmark college
router.delete('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedColleges = user.savedColleges.filter(id => id.toString() !== req.params.id);
    await user.save();
    
    res.json({ message: 'College removed successfully', savedColleges: user.savedColleges });
  } catch (error) {
    res.status(500).json({ message: 'Error removing college', error: error.message });
  }
});

// POST /api/colleges/:id/reviews/:reviewId/helpful - Upvote review
router.post('/:id/reviews/:reviewId/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    review.helpfulVotes += 1;
    await review.save();
    
    // Trigger notification if not upvoting own review
    if (review.userId.toString() !== req.user.id) {
      const upvoter = await User.findById(req.user.id);
      await Notification.create({
        userId: review.userId,
        type: 'review_upvoted',
        relatedCollegeId: req.params.id,
        relatedContentId: review._id,
        message: `${upvoter?.username || 'Someone'} found your review helpful.`
      });
    }
    
    res.json({ helpfulVotes: review.helpfulVotes });
  } catch (error) {
    res.status(500).json({ message: 'Error upvoting review', error: error.message });
  }
});

// POST /api/colleges/recommend - AI College Recommendation
router.post('/recommend', async (req, res) => {
  try {
    const { scores, course, budget, location, priorities } = req.body;
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fetch all colleges to process
    let colleges = await College.find();
    
    // Filter by course if provided
    if (course) {
      const courseRegex = new RegExp(course, 'i');
      const filtered = colleges.filter(c => 
        c.coursesOffered.some(co => courseRegex.test(co.name))
      );
      if (filtered.length > 0) colleges = filtered;
    }

    // Process and score colleges
    const scoredColleges = colleges.map(college => {
      let score = 70 + Math.floor(Math.random() * 20); // Base score 70-89
      let reason = "Good overall fit based on your preferences.";

      // Adjust based on budget
      const totalFees = (college.fees.tuition || 0) + (college.fees.hostel || 0);
      if (budget && totalFees <= parseInt(budget)) {
        score += 10;
        reason = `Great financial fit, well under your ${budget} budget.`;
      } else if (budget && totalFees > parseInt(budget)) {
        score -= 10;
        reason = `Slightly above your budget, but offers great ROI.`;
      }

      // Adjust based on location
      if (location && (location.toLowerCase() === college.location.state.toLowerCase() || location.toLowerCase() === college.location.city.toLowerCase())) {
        score += 5;
        reason += ` Matches your location preference in ${college.location.city}.`;
      }

      const collegeObj = college.toObject();
      return { ...collegeObj, matchScore: Math.min(score, 99), matchReason: reason };
    });

    // Sort by score
    scoredColleges.sort((a, b) => b.matchScore - a.matchScore);

    // Group into Reach, Target, Safe (simulated logic)
    const result = {
      reach: [],
      target: [],
      safe: []
    };

    scoredColleges.forEach((c, index) => {
      // Top 20% are Reach, next 40% are Target, rest are Safe (or similar split based on count)
      if (index < 2) {
        result.reach.push(c);
      } else if (index < 5) {
        result.target.push(c);
      } else if (index < 9) {
        result.safe.push(c);
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
});

module.exports = router;
