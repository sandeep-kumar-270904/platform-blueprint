const ScholarshipApplication = require('../models/ScholarshipApplication');
const ScholarshipReview = require('../models/ScholarshipReview');

exports.addScholarshipReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText, wasAwarded } = req.body;

    const application = await ScholarshipApplication.findOne({
      userId: req.user.id,
      scholarshipId: id
    });

    if (!application) {
      return res.status(403).json({ 
        message: 'You must apply for this scholarship before you can submit a review.' 
      });
    }

    const existingReview = await ScholarshipReview.findOne({
      userId: req.user.id,
      scholarshipId: id
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this scholarship.' 
      });
    }

    const review = new ScholarshipReview({
      scholarshipId: id,
      userId: req.user.id,
      applicationId: application._id,
      rating,
      reviewText,
      wasAwarded
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Error adding review', error: err.message });
  }
};

// Support anonymousReview
