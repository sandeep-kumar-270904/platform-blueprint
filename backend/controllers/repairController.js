const RepairProvider = require('../models/RepairProvider');

// Helper to calculate if open now based on operating hours
const calculateAvailability = (provider) => {
  if (provider.manualStatusOverride) {
    return provider.manualStatusOverride;
  }
  
  if (!provider.operatingHours || provider.operatingHours.length === 0) {
    return "Usually responds within 2 hours"; // Fallback
  }

  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayStr = days[now.getDay()];
  
  const todaySchedule = provider.operatingHours.find(h => h.day === currentDayStr);
  
  if (!todaySchedule || !todaySchedule.isOpen) {
    return "Closed";
  }

  // Parse HH:mm to check if current time is within bounds
  const [openHour, openMin] = todaySchedule.openTime.split(':').map(Number);
  const [closeHour, closeMin] = todaySchedule.closeTime.split(':').map(Number);
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  if (currentTime >= openTime && currentTime <= closeTime) {
    return "Open now";
  }
  
  return "Closed";
};

// @desc    Get repair service providers
// @route   GET /api/repair
// @access  Public
exports.getProviders = async (req, res) => {
  try {
    const { category, sort, page = 1, limit = 6, lat, lng } = req.query;

    let query = {};
    
    // Filtering
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    let queryObj = RepairProvider.find(query);

    // Sorting
    let sortObj = {};
    if (sort === 'top_rated') {
      sortObj.rating = -1;
      queryObj = queryObj.sort(sortObj);
    } else if (sort === 'price_low') {
      sortObj.basePrice = 1;
      queryObj = queryObj.sort(sortObj);
    } else if (sort === 'nearest' && lat && lng) {
      // If coordinates are provided, use $near aggregation instead of standard find()
      // Fallback to find() if invalid coords
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        // Rewrite query to use $near
        query = {
          ...query,
          "location.coordinates": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude]
              }
            }
          }
        };
        queryObj = RepairProvider.find(query);
      } else {
        // Fallback if bad coords
        sortObj.rating = -1;
        queryObj = queryObj.sort(sortObj);
      }
    } else {
      // Default fallback sort (e.g. if 'nearest' requested but no coords provided)
      sortObj.rating = -1;
      queryObj = queryObj.sort(sortObj);
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 6;
    const skip = (pageNum - 1) * limitNum;

    queryObj = queryObj.skip(skip).limit(limitNum);

    // Execution with projection to reduce payload size
    const providers = await queryObj.select('-operatingHours -services -contact -manualStatusOverride');
    
    // Map to include computed availability
    const mappedProviders = providers.map(p => {
      const pObj = p.toObject();
      pObj.availability = calculateAvailability(pObj);
      
      // format location coords nicely if needed, or hide them
      pObj.id = pObj._id; // ensure frontend standard id maps
      return pObj;
    });

    // Count for pagination
    const total = await RepairProvider.countDocuments(query);

    res.status(200).json({
      success: true,
      count: mappedProviders.length,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: mappedProviders
    });
  } catch (error) {
    console.error('Error fetching repair providers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const RepairReview = require('../models/RepairReview');

// @desc    Get provider by ID
// @route   GET /api/repair/:id
// @access  Public
exports.getProviderById = async (req, res) => {
  try {
    const provider = await RepairProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    const pObj = provider.toObject();
    pObj.availability = calculateAvailability(pObj);
    pObj.id = pObj._id;
    res.status(200).json({ success: true, data: pObj });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get reviews for a provider
// @route   GET /api/repair/:id/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    let sortObj = { createdAt: -1 };
    if (sort === 'helpful') {
      sortObj = { helpfulCount: -1, createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const reviews = await RepairReview.find({ 
      providerId: req.params.id,
      moderationStatus: 'active' 
    })
      .populate('userId', 'username full_name profile_picture')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const formatted = reviews.map(r => {
      const robj = r.toObject();
      robj.id = robj._id;
      return robj;
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add a review
// @route   POST /api/repair/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const providerId = req.params.id;
    const userId = req.user.id;

    const providerExists = await RepairProvider.findById(providerId);
    if (!providerExists) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    // Check for existing review
    let review = await RepairReview.findOne({ providerId, userId });

    if (review) {
      // Update
      review.rating = rating;
      review.comment = comment;
      review.isEdited = true;
      review.lastEditedAt = Date.now();
      await review.save();
    } else {
      // Create
      // Unique index {providerId, userId} prevents race condition duplicates at DB level
      review = await RepairReview.create({
        providerId,
        userId,
        rating,
        comment
      });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/repair/reviews/:id/helpful
// @access  Private
exports.markReviewHelpful = async (req, res) => {
  try {
    const review = await RepairReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

    if (review.helpfulUsers.includes(req.user.id)) {
      return res.status(400).json({ success: false, error: 'Already marked as helpful' });
    }

    review.helpfulUsers.push(req.user.id);
    review.helpfulCount += 1;
    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Flag a review
// @route   PUT /api/repair/reviews/:id/flag
// @access  Private
exports.flagReview = async (req, res) => {
  try {
    const review = await RepairReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

    if (review.flaggedByUsers && review.flaggedByUsers.includes(req.user.id)) {
      return res.status(400).json({ success: false, error: 'Already flagged this review' });
    }

    if (!review.flaggedByUsers) review.flaggedByUsers = [];
    review.flaggedByUsers.push(req.user.id);
    review.flagsCount += 1;

    // Threshold logic
    if (review.flagsCount >= 3) {
      review.moderationStatus = 'flagged';
    }

    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
