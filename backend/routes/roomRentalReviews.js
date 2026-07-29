const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const sanitize = require('../middleware/sanitize');
const RoomRentalReview = require('../models/RoomRentalReview');
const RoomInquiry = require('../models/RoomInquiry');
const RoomRental = require('../models/RoomRental');
const Notification = require('../models/Notification');
const rateLimit = require('express-rate-limit');


const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Too many review actions, please try again later.' }
});

// GET /room/:roomId - Fetch reviews for a specific room + aggregate
router.get('/room/:roomId', async (req, res) => {
  try {
    const reviews = await RoomRentalReview.find({ room: req.params.roomId })
      .populate('reviewer', 'name profilePicture')
      .sort({ createdAt: -1 });

    const aggregate = await RoomRentalReview.aggregate([
      { $match: { room: new mongoose.Types.ObjectId(req.params.roomId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const stats = aggregate.length > 0 ? { avgRating: aggregate[0].avgRating, count: aggregate[0].count } : { avgRating: 0, count: 0 };
    
    res.json({ reviews, stats });
  } catch (error) {
    console.error('Error fetching room reviews:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /owner/:ownerId - Fetch aggregate rating for an owner across all their listings
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const aggregate = await RoomRentalReview.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(req.params.ownerId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const stats = aggregate.length > 0 ? { avgRating: aggregate[0].avgRating, count: aggregate[0].count } : { avgRating: 0, count: 0 };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching owner reputation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /room/:roomId - Leave a review
router.post('/room/:roomId', auth, isNotBanned, sanitize, reviewLimiter, async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    if (!rating || rating < 1 || rating > 5 || !reviewText) {
      return res.status(400).json({ message: 'Invalid rating or review text' });
    }

    const room = await RoomRental.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Validate if reviewer is the owner
    if (room.lister.toString() === (req.user.id || req.user.userId)) {
      return res.status(400).json({ message: 'You cannot review your own listing.' });
    }

    // Must have a "Responded" inquiry
    const inquiry = await RoomInquiry.findOne({
      room: req.params.roomId,
      sender: req.user.id || req.user.userId,
      status: 'Responded'
    });

    if (!inquiry) {
      return res.status(403).json({ message: 'You must have an accepted/responded inquiry with the owner to leave a review.' });
    }

    const existingReview = await RoomRentalReview.findOne({
      room: req.params.roomId,
      reviewer: req.user.id || req.user.userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this room.' });
    }

    const review = new RoomRentalReview({
      room: req.params.roomId,
      owner: room.lister,
      reviewer: req.user.id || req.user.userId,
      rating,
      reviewText
    });

    await review.save();
    
    // Send notification to the listing owner
    try {
      await Notification.create({
        userId: room.lister,
        type: 'room_rental_review_received',
        message: `You received a new ${rating}-star review on your listing "${room.title}".`,
        actionUrl: `/room-rentals?room=${room._id}`,
        channel: 'in_app'
      });
    } catch (notifErr) {
      console.error('Failed to send review notification:', notifErr);
    }
    
    // Populate before returning
    await review.populate('reviewer', 'name profilePicture');
    res.status(201).json(review);
  } catch (error) {
    console.error('Error leaving review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /:id - Edit own review
router.put('/:id', auth, isNotBanned, sanitize, reviewLimiter, async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    const review = await RoomRentalReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.reviewer.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (rating) review.rating = rating;
    if (reviewText) review.reviewText = reviewText;

    await review.save();
    await review.populate('reviewer', 'name profilePicture');
    res.json(review);
  } catch (error) {
    console.error('Error editing review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /:id - Delete own review
router.delete('/:id', auth, isNotBanned, async (req, res) => {
  try {
    const review = await RoomRentalReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.reviewer.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await RoomRentalReview.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /:id/report - Report a review
router.post('/:id/report', auth, isNotBanned, sanitize, reviewLimiter, async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await RoomRentalReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const alreadyReported = review.reports.some(r => r.user.toString() === (req.user.id || req.user.userId));
    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }

    review.reports.push({
      user: req.user.id || req.user.userId,
      reason
    });
    
    await review.save();
    res.json({ message: 'Review reported' });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
