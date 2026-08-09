const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Review = require('../models/Review');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const CollegeQuestion = require('../models/CollegeQuestion');
const auth = require('../middleware/auth');
const { qaPostLimiter, reviewLimiter } = require('../middleware/rateLimiter');
const mongoose = require('mongoose');

// Validate ObjectId for all routes using :id
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
});

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

// GET /api/colleges/comparisons - Get user's saved comparison sets
router.get('/comparisons', auth, async (req, res) => {
  try {
    const ComparisonSet = require('../models/ComparisonSet');
    const sets = await ComparisonSet.find({ userId: req.user.id })
      .populate('colleges', 'name logoOrIcon location type rating')
      .sort({ createdAt: -1 });
    res.json(sets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/colleges/comparisons - Save a comparison set
router.post('/comparisons', auth, async (req, res) => {
  try {
    const { name, collegeIds } = req.body;
    const ComparisonSet = require('../models/ComparisonSet');
    
    if (!collegeIds || collegeIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 colleges required' });
    }
    
    const newSet = new ComparisonSet({
      userId: req.user.id,
      name: name || 'Saved Comparison',
      colleges: collegeIds
    });
    
    await newSet.save();
    res.status(201).json(newSet);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/colleges/comparisons/:id
router.delete('/comparisons/:id', auth, async (req, res) => {
  try {
    const ComparisonSet = require('../models/ComparisonSet');
    const deleted = await ComparisonSet.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Comparison set not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// POST /api/colleges/:id/claim - Request official account status
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const { officialEmail, proofDocumentUrl, role } = req.body;
    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');

    const existingClaim = await CollegeOfficialAccount.findOne({ userId: req.user.id, collegeId: req.params.id });
    if (existingClaim) {
      return res.status(400).json({ message: 'You have already submitted a claim for this college.' });
    }

    const claim = await CollegeOfficialAccount.create({
      userId: req.user.id,
      collegeId: req.params.id,
      officialEmail,
      proofDocumentUrl,
      role: role || 'representative'
    });

    res.status(201).json({ message: 'Claim submitted successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/colleges/:id/official-status - Check if user is an official
router.get('/:id/official-status', auth, async (req, res) => {
  try {
    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');
    const claim = await CollegeOfficialAccount.findOne({ userId: req.user.id, collegeId: req.params.id });
    
    if (!claim) {
      return res.json({ status: 'none' });
    }
    res.json({ status: claim.verificationStatus, role: claim.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/colleges/:id/events
router.get('/:id/events', async (req, res) => {
  try {
    const Event = require('../models/Event');
    
    const now = new Date();
    const upcoming = await Event.find({
      hostCollegeId: req.params.id,
      status: 'approved',
      startDate: { $gte: now }
    }).sort({ startDate: 1 });
    
    const past = await Event.find({
      hostCollegeId: req.params.id,
      status: { $in: ['approved', 'completed'] },
      startDate: { $lt: now }
    }).sort({ startDate: -1 });

    res.json({ upcoming, past });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
router.post('/:id/questions', auth, qaPostLimiter, async (req, res) => {
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
    
    const collegeData = req.body;
    // Allow anyone to publish immediately (no admin approval required)
    collegeData.draft = false;

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
    
    // Cascade delete associated data
    await Review.deleteMany({ collegeId: req.params.id });
    const CollegeQuestion = require('../models/CollegeQuestion');
    const CollegeAnswer = require('../models/CollegeAnswer');
    const questions = await CollegeQuestion.find({ collegeId: req.params.id });
    const questionIds = questions.map(q => q._id);
    await CollegeAnswer.deleteMany({ questionId: { $in: questionIds } });
    await CollegeQuestion.deleteMany({ collegeId: req.params.id });
    
    const Event = require('../models/Event');
    await Event.updateMany({ hostCollegeId: req.params.id }, { $unset: { hostCollegeId: 1 } });
    
    res.json({ message: 'College and associated data deleted' });
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

// GET /api/colleges/:id/reality-check
router.get('/:id/reality-check', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });

    let feesTotal = null;
    if (college.fees) {
      feesTotal = (college.fees.tuition || 0) + (college.fees.hostel || 0) + (college.fees.other || 0);
    }

    const official = {
      placementRate: college.placementPercentage || null,
      avgPackage: college.avgPackage ? parseFloat(college.avgPackage) : null,
      fees: feesTotal || null
    };

    const { aggregateCollegeReviews } = require('../services/collegeReviewAggregator');
    const studentExperience = await aggregateCollegeReviews(req.params.id);

    res.json({ official, studentExperience });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reality check', error: error.message });
  }
});

// POST /api/colleges/:id/reviews - Submit review
router.post('/:id/reviews', auth, reviewLimiter, async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });

    // Check if official account (cannot review any college - conflict of interest)
    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');
    const isOfficial = await CollegeOfficialAccount.findOne({ 
      userId: req.user.id, 
      verificationStatus: 'verified' 
    });
    if (isOfficial) return res.status(403).json({ message: 'Official college accounts cannot submit student reviews' });

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

    const { categoryRatings, title, reviewText, pros, cons, wouldRecommend, yearAttended, courseStudied, yearOfStudy } = req.body;
    let overallRating = Number(req.body.rating) || 0;
    
    if (categoryRatings) {
      const cats = ['academics', 'placements', 'faculty', 'infrastructure', 'hostel', 'campusLife', 'valueForMoney'];
      let sum = 0;
      let count = 0;
      cats.forEach(c => {
        if (categoryRatings[c] !== undefined) {
          let catVal = Number(categoryRatings[c]);
          if (!isNaN(catVal) && catVal >= 1 && catVal <= 5) {
            sum += catVal;
            count++;
          }
        }
      });
      if (count === 7) {
        overallRating = Math.round((sum / 7) * 10) / 10;
      } else if (count > 0) {
        overallRating = Math.round((sum / count) * 10) / 10;
      }
    }
    
    if (overallRating < 1 || overallRating > 5) {
      overallRating = 1; // Fallback
    }

    const ipAddress = req.ip || req.connection.remoteAddress;

    const review = new Review({
      title, reviewText, pros, cons, wouldRecommend, yearAttended, courseStudied, yearOfStudy,
      categoryRatings,
      rating: overallRating,
      overallRating: overallRating,
      collegeId: req.params.id,
      userId: req.user.id,
      ipAddress,
      verificationStatus,
      verificationMethod: verificationStatus === 'verified' ? 'domain_match' : undefined
    });
    await review.save();

    // Update college rating
    const allReviews = await Review.find({ collegeId: req.params.id, status: 'public' });
    college.totalReviews = allReviews.length;
    
    if (college.totalReviews > 0) {
      college.rating = Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / college.totalReviews) * 10) / 10;
      const cats = ['hostel', 'valueForMoney', 'faculty', 'campusLife', 'placements', 'academics', 'infrastructure'];
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
      await notificationService.createNotification({
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
    
    // Fetch all colleges to process
    let colleges = await College.find({ draft: { $ne: true } });
    
    // Initial filtering to reduce token usage
    if (course) {
      const courseRegex = new RegExp(course, 'i');
      const filtered = colleges.filter(c => 
        c.coursesOffered.some(co => courseRegex.test(co.name))
      );
      if (filtered.length > 0) colleges = filtered;
    }

    // Limit to top 20 for AI processing
    colleges = colleges.slice(0, 20);

    const collegeDataForPrompt = colleges.map(c => ({
      id: c._id,
      name: c.name,
      location: `${c.location.city}, ${c.location.state}`,
      fees: (c.fees.tuition || 0) + (c.fees.hostel || 0),
      rating: c.rating
    }));

    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no API key
      const result = { reach: [], target: [], safe: [] };
      colleges.forEach((c, index) => {
        const cObj = { ...c.toObject(), matchScore: 85, matchReason: "Good fit (Fallback without API Key)" };
        if (index < 2) result.reach.push(cObj);
        else if (index < 5) result.target.push(cObj);
        else if (index < 9) result.safe.push(cObj);
      });
      return res.json(result);
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert college admissions counselor AI. 
      Given the student's profile:
      - Scores: ${JSON.stringify(scores)}
      - Course preference: ${course || 'Any'}
      - Budget (total fees): ${budget || 'Any'}
      - Location preference: ${location || 'Any'}
      - Priorities: ${priorities ? priorities.join(', ') : 'None'}

      And given these available colleges:
      ${JSON.stringify(collegeDataForPrompt)}

      Please select the best colleges and classify them into three arrays: "reach" (ambitious), "target" (good fit), and "safe" (very likely).
      For each selected college, provide:
      - "id": The exact college ID.
      - "matchReason": A short 1-sentence reason why it fits this specific student profile.
      - "matchScore": A number from 1 to 99 indicating match quality.

      Return ONLY a valid JSON object matching this schema:
      {
        "reach": [ { "id": "...", "matchReason": "...", "matchScore": 90 } ],
        "target": [ ... ],
        "safe": [ ... ]
      }
    `;

    const aiResult = await model.generateContent(prompt);
    const responseText = await aiResult.response.text();
    
    // Extract JSON block
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return JSON");
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    const result = { reach: [], target: [], safe: [] };
    
    const populateCategory = (categoryName) => {
      if (Array.isArray(parsedData[categoryName])) {
        parsedData[categoryName].forEach(aiCol => {
          const matchedDbCol = colleges.find(c => c._id.toString() === aiCol.id);
          if (matchedDbCol) {
            result[categoryName].push({
              ...matchedDbCol.toObject(),
              matchReason: aiCol.matchReason || "Recommended by AI",
              matchScore: aiCol.matchScore || 85
            });
          }
        });
      }
    };

    populateCategory('reach');
    populateCategory('target');
    populateCategory('safe');

    res.json(result);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
});

// GET /api/colleges/:id/fees - Get fee structure
router.get('/:id/fees', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college.feeStructure || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/colleges/:id/fees - Admin update fee structure
router.put('/:id/fees', auth, isAdmin, async (req, res) => {
  try {
    const { feeStructure } = req.body;
    if (!feeStructure || !Array.isArray(feeStructure)) {
      return res.status(400).json({ message: 'Invalid feeStructure array' });
    }
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { feeStructure },
      { new: true }
    );
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college.feeStructure);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/colleges/:id/fee-reminder - Get personal fee reminder
router.get('/:id/fee-reminder', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const reminder = user.feeReminders?.find(r => r.collegeId.toString() === req.params.id);
    res.json({ note: reminder ? reminder.note : '' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/colleges/:id/fee-reminder - Create/Update fee reminder
router.post('/:id/fee-reminder', auth, async (req, res) => {
  try {
    const { note } = req.body;
    const user = await User.findById(req.user.id);
    
    // Check if college is saved
    const isSaved = user.savedColleges.some(c => c.toString() === req.params.id);
    if (!isSaved) {
      return res.status(403).json({ message: 'You must save the college before setting a reminder' });
    }

    if (!user.feeReminders) user.feeReminders = [];
    
    const existingIndex = user.feeReminders.findIndex(r => r.collegeId.toString() === req.params.id);
    if (existingIndex > -1) {
      user.feeReminders[existingIndex].note = note;
    } else {
      user.feeReminders.push({ collegeId: req.params.id, note });
    }
    
    await user.save();
    res.json({ note: user.feeReminders.find(r => r.collegeId.toString() === req.params.id).note });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/colleges/:id/claims
router.post('/:id/claims', auth, async (req, res) => {
  try {
    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });

    const existingClaim = await CollegeOfficialAccount.findOne({ 
      userId: req.user.id, 
      collegeId: req.params.id 
    });
    
    if (existingClaim) {
      return res.status(400).json({ message: 'You have already submitted a claim for this college' });
    }
    
    const user = await User.findById(req.user.id);

    const claim = new CollegeOfficialAccount({
      userId: req.user.id,
      collegeId: req.params.id,
      officialEmail: user.email,
      verificationStatus: 'pending'
    });
    
    await claim.save();
    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting claim', error: error.message });
  }
});

module.exports = router;
