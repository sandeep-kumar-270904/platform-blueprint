const Team = require('../models/Team');
const TeamReview = require('../models/TeamReview');
const TeamApplication = require('../models/TeamApplication');
const { sendNotification } = require('../services/notificationService');

// @desc    Create a review for a teammate
// @route   POST /api/teams/:id/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const teamId = req.params.id;
    const { revieweeId, rating, comment } = req.body;

    if (!revieweeId || !rating) {
      return res.status(400).json({ success: false, message: 'Please provide reviewee and rating' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (req.user.id === revieweeId) {
      return res.status(400).json({ success: false, message: 'Cannot review yourself' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Team must be completed before leaving reviews' });
    }

    // Ensure reviewer was an accepted member (or creator)
    let isReviewerValid = team.creator.toString() === req.user.id;
    if (!isReviewerValid) {
      const reviewerApp = await TeamApplication.findOne({ team: teamId, applicant: req.user.id, status: 'accepted' });
      if (reviewerApp) isReviewerValid = true;
    }

    // Ensure reviewee was an accepted member (or creator)
    let isRevieweeValid = team.creator.toString() === revieweeId;
    if (!isRevieweeValid) {
      const revieweeApp = await TeamApplication.findOne({ team: teamId, applicant: revieweeId, status: 'accepted' });
      if (revieweeApp) isRevieweeValid = true;
    }

    if (!isReviewerValid || !isRevieweeValid) {
      return res.status(403).json({ success: false, message: 'Both users must have been accepted members of the team' });
    }

    // Check for existing review
    const existingReview = await TeamReview.findOne({ team: teamId, reviewer: req.user.id, reviewee: revieweeId });
    if (existingReview) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this teammate for this project' });
    }

    const review = await TeamReview.create({
      team: teamId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      comment
    });

    // Notify reviewee
    await sendNotification({
      userId: revieweeId,
      type: 'team_review_received',
      actorId: req.user.id,
      relatedContentId: team._id.toString(),
      title: 'New Team Review',
      body: `You received a ${rating}-star review for your work on ${team.title}`
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Review already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/users/:id/reviews
// @access  Public
exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch paginated reviews
    const reviews = await TeamReview.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviewer', 'username full_name avatar')
      .populate('team', 'title category');

    // Aggregate average rating
    const aggregation = await TeamReview.aggregate([
      { $match: { reviewee: require('mongoose').Types.ObjectId(userId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const stats = aggregation.length > 0 ? aggregation[0] : { averageRating: 0, totalReviews: 0 };

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: stats.totalReviews
        },
        page: parseInt(page),
        pages: Math.ceil(stats.totalReviews / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
