const LearningResource = require('../models/LearningResource');
const ResourceReview = require('../models/ResourceReview');
const youtubeService = require('../services/youtubeService');
const mongoose = require('mongoose');

// @desc    Submit a new YouTube Learning Resource
// @route   POST /api/learning-resources
// @access  Private
exports.submitResource = async (req, res) => {
  try {
    const { url, subject, topic, difficulty, language, tags, recommendationReason } = req.body;

    if (!url || !subject || !topic || !difficulty) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    // 1. Parse the YouTube URL
    let parsedResource;
    try {
      parsedResource = youtubeService.parseUrl(url);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    // 2. Fetch Metadata from YouTube
    let ytData;
    try {
      ytData = await youtubeService.fetchMetadata(parsedResource);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    // 3. Check for duplicates
    const existing = await LearningResource.findOne({ youtubeId: ytData.youtubeId });
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        error: 'This resource has already been submitted by the community.',
        resourceId: existing._id
      });
    }

    // 4. Create new resource in database
    const resource = await LearningResource.create({
      ...ytData,
      submitter: req.user.id, // Assumes standard auth middleware setting req.user
      subject,
      topic,
      difficulty,
      language: language || 'English',
      tags: tags || [],
      recommendationReason
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error('Submit Resource Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all active learning resources with search and filters
// @route   GET /api/learning-resources
// @access  Public (or Private depending on app rules)
exports.getResources = async (req, res) => {
  try {
    const { search, subject, topic, difficulty, type, sort = 'newest', page = 1, limit = 12 } = req.query;
    
    let query = { status: 'ACTIVE' };

    // Text search if query provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filters
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;

    // Sorting
    let sortObj = { createdAt: -1 };
    if (sort === 'highest_rated') sortObj = { recommendationRate: -1, averageRating: -1 };
    if (sort === 'most_reviewed') sortObj = { reviewCount: -1 };
    if (sort === 'most_viewed') sortObj = { views: -1 };
    if (search) sortObj = { score: { $meta: "textScore" } }; // Relevance sort for search

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const resources = await LearningResource.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('submitter', 'username full_name avatar_url');

    const total = await LearningResource.countDocuments(query);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Get Resources Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single resource by ID with reviews
// @route   GET /api/learning-resources/:id
// @access  Public
exports.getResourceById = async (req, res) => {
  try {
    const resource = await LearningResource.findById(req.params.id)
      .populate('submitter', 'username full_name avatar_url');

    if (!resource || resource.status === 'REMOVED' || resource.status === 'ARCHIVED') {
      return res.status(404).json({ success: false, error: 'Resource not found or unavailable' });
    }

    const reviews = await ResourceReview.find({ resource: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'username full_name avatar_url');

    res.status(200).json({ success: true, data: resource, reviews });
  } catch (error) {
    console.error('Get Resource By ID Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add or update a review for a resource
// @route   POST /api/learning-resources/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const { overall, explanation, usefulness, practicalValue, difficulty, wouldRecommend, textReview, tags } = req.body;

    const resource = await LearningResource.findById(resourceId);
    if (!resource || resource.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, error: 'Resource not available for review' });
    }

    // Check if user already reviewed
    let review = await ResourceReview.findOne({ user: userId, resource: resourceId });

    if (review) {
      // Update existing
      review.overall = overall;
      review.explanation = explanation;
      review.usefulness = usefulness;
      review.practicalValue = practicalValue;
      review.difficulty = difficulty;
      review.wouldRecommend = wouldRecommend;
      review.textReview = textReview;
      review.tags = tags;
      await review.save();
    } else {
      // Create new
      review = await ResourceReview.create({
        user: userId,
        resource: resourceId,
        overall,
        explanation,
        usefulness,
        practicalValue,
        difficulty,
        wouldRecommend,
        textReview,
        tags
      });
    }

    // Recalculate aggregates
    await this.recalculateResourceAggregates(resourceId);

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('Add Review Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Report a resource
// @route   POST /api/learning-resources/:id/report
// @access  Private
exports.reportResource = async (req, res) => {
  try {
    const resource = await LearningResource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    resource.reportCount += 1;
    
    // Auto-pend if too many reports
    if (resource.reportCount >= 5) {
      resource.status = 'PENDING';
    }

    await resource.save();
    res.status(200).json({ success: true, message: 'Resource reported successfully' });
  } catch (error) {
    console.error('Report Resource Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Helper: Recalculate Aggregates
exports.recalculateResourceAggregates = async (resourceId) => {
  const reviews = await ResourceReview.find({ resource: resourceId });
  
  if (reviews.length === 0) return;

  let totalOverall = 0;
  let recommendCount = 0;

  reviews.forEach(r => {
    totalOverall += r.overall;
    if (r.wouldRecommend) recommendCount++;
  });

  const averageRating = (totalOverall / reviews.length).toFixed(1);
  const recommendationRate = Math.round((recommendCount / reviews.length) * 100);

  await LearningResource.findByIdAndUpdate(resourceId, {
    averageRating: parseFloat(averageRating),
    reviewCount: reviews.length,
    recommendationRate
  });
};
