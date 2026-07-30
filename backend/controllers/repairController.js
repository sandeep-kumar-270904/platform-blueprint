const RepairProvider = require('../models/RepairProvider');
const ProviderReport = require('../models/ProviderReport');
const SavedProvider = require('../models/SavedProvider');
const ProviderStatsService = require('../services/ProviderStatsService');
const notificationService = require('../services/notificationService');

// Simple TTL Cache for Recommendations
const recommendationsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    const { category, sort, page = 1, limit = 6, lat, lng, search, minRating, priceMin, priceMax, openNow, currentDay, currentTime } = req.query;

    let query = {};
    
    // Filtering
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (priceMin || priceMax) {
      query.basePrice = {};
      if (priceMin) query.basePrice.$gte = parseFloat(priceMin);
      if (priceMax) query.basePrice.$lte = parseFloat(priceMax);
    }

    if (openNow === 'true' && currentDay && currentTime) {
      const timeInMinutes = parseInt(currentTime, 10);
      
      // We want providers where operatingHours contains an entry for currentDay 
      // where isOpen is true, AND openTime <= currentTime <= closeTime.
      // Since times are stored as "HH:mm" strings, we can't easily do numeric comparison 
      // without complex aggregation. 
      // To keep it clean and robust, we can use $expr with string splitting, or 
      // we can do a simplified filter: we assume the string format "HH:mm" can be sorted/compared lexically.
      // E.g., "09:00" <= "14:30" <= "17:00".
      
      const hours = Math.floor(timeInMinutes / 60).toString().padStart(2, '0');
      const mins = (timeInMinutes % 60).toString().padStart(2, '0');
      const timeString = `${hours}:${mins}`;

      query.operatingHours = {
        $elemMatch: {
          day: currentDay,
          isOpen: true,
          openTime: { $lte: timeString },
          closeTime: { $gte: timeString }
        }
      };
      
      // Also respect manualStatusOverride
      query.manualStatusOverride = { $ne: 'Closed' };
    } else if (openNow === 'true') {
      // Fallback if client doesn't send time
      query.manualStatusOverride = { $ne: 'Closed' };
    }

    let queryObj = RepairProvider.find(query);

    let sortObj = {};
    if (search) {
      // If there's a text search, default sort by relevance score unless explicitly overridden
      if (!sort || sort === 'top_rated') {
         sortObj.score = { $meta: "textScore" };
         queryObj = queryObj.sort(sortObj).select({ score: { $meta: "textScore" }, '-operatingHours': 1, '-services': 1, '-contact': 1, '-manualStatusOverride': 1 });
      } else {
         if (sort === 'price_low') sortObj.basePrice = 1;
         queryObj = queryObj.sort(sortObj);
      }
    } else {
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
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 6;
    const skip = (pageNum - 1) * limitNum;

    queryObj = queryObj.skip(skip).limit(limitNum);

    // We must select fields needed for calculateAvailability, then remove them before sending to client
    const providers = await queryObj.select('name category description services priceIndicator basePrice location rating reviewsCount verification badges operatingHours manualStatusOverride');
    
    // Map to include computed availability and check save state
    let savedProviderIds = new Set();
    if (req.user) {
      const savedProviders = await SavedProvider.find({ userId: req.user.id });
      savedProviders.forEach(sp => savedProviderIds.add(sp.providerId.toString()));
    }

    const mappedProviders = providers.map(p => {
      const pObj = p.toObject();
      pObj.availability = calculateAvailability(pObj);
      pObj.isSaved = savedProviderIds.has(pObj._id.toString());
      
      // Remove large fields not needed for the card view
      delete pObj.operatingHours;
      delete pObj.manualStatusOverride;
      
      if (pObj.services && pObj.services.length > 3) {
        pObj.services = pObj.services.slice(0, 3);
      }
      
      // format location coords nicely if needed, or hide them
      if (pObj.location && pObj.location.coordinates) {
         delete pObj.location.coordinates;
      }

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

    if (req.user) {
      const saved = await SavedProvider.findOne({ userId: req.user.id, providerId: pObj._id });
      pObj.isSaved = !!saved;
    } else {
      pObj.isSaved = false;
    }

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

// @desc    Compare multiple providers
// @route   GET /api/repair/compare
// @access  Public
exports.getCompareProviders = async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, error: 'No provider IDs specified' });
    }

    const idArray = ids.split(',').filter(id => id.trim() !== '');
    if (idArray.length > 3) {
      return res.status(400).json({ success: false, error: 'You can only compare up to 3 providers at once' });
    }

    const providers = await RepairProvider.find({ _id: { $in: idArray } })
      .select('name category rating reviewsCount basePrice priceIndicator availability services location manualStatusOverride operatingHours');

    // Process availability and map to expected format
    const formatted = providers.map(p => {
      const pObj = p.toObject();
      pObj.availability = calculateAvailability(pObj);
      pObj.id = pObj._id;
      // Exclude heavy hours array from response since we computed availability
      delete pObj.operatingHours;
      return pObj;
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error in compare providers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const RepairRequest = require('../models/RepairRequest');

// @desc    Create a new repair request
// @route   POST /api/repair/requests
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { providerId, issueDescription, quickIssueCategory, preferredDate, preferredTime, isAsap, contactPhone } = req.body;
    
    // Check if provider exists and is active
    const provider = await RepairProvider.findById(providerId);
    if (!provider || provider.manualStatusOverride === 'Closed') { // Simplify active check for prototype
      return res.status(400).json({ success: false, error: 'Provider is not available or does not exist.' });
    }

    // Duplicate rapid-fire check (same user, provider, and exact issue in last 60s)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const existingReq = await RepairRequest.findOne({
      userId: req.user.id,
      providerId,
      issueDescription,
      createdAt: { $gte: oneMinuteAgo }
    });

    if (existingReq) {
      return res.status(429).json({ success: false, error: 'Duplicate request detected. Please wait before submitting again.' });
    }

    // Photo
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/repair/${req.file.filename}`;
    }

    const newRequest = await RepairRequest.create({
      providerId,
      userId: req.user.id,
      issueDescription,
      quickIssueCategory,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTime: isAsap ? 'ASAP' : preferredTime,
      isAsap: isAsap === 'true' || isAsap === true,
      contactSnapshot: {
        phone: contactPhone,
        email: req.user.email // From auth middleware
      },
      photoUrl,
      status: 'Pending',
      statusHistory: [{
        status: 'Pending',
        changedBy: req.user.id
      }]
    });

    recommendationsCache.delete(req.user.id);

    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user's repair requests
// @route   GET /api/repair/requests
// @access  Private
exports.getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { userId: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const requests = await RepairRequest.find(query)
      .populate('providerId', 'name category')
      .sort('-createdAt');

    // Map to include providerName in root for frontend convenience
    const formatted = requests.map(req => {
      const obj = req.toObject();
      obj.providerName = obj.providerId?.name || 'Unknown Provider';
      obj.id = obj._id;
      return obj;
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Cancel a pending request
// @route   PUT /api/repair/requests/:id/cancel
// @access  Private
exports.cancelRequest = async (req, res) => {
  try {
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Must belong to user
    if (request.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // No-op if already cancelled or completed
    if (request.status === 'Cancelled' || request.status === 'Completed') {
      return res.status(200).json({ success: true, data: request, message: 'Request already cancelled or completed' });
    }

    // Strict transition rule: user can only cancel if Pending or Accepted
    if (!['Pending', 'Accepted'].includes(request.status)) {
      return res.status(400).json({ success: false, error: 'Cannot cancel request at this stage' });
    }

    request.status = 'Cancelled';
    request.statusHistory.push({
      status: 'Cancelled',
      changedBy: req.user.id
    });

    await request.save();

    // 1. Emit real-time UI update
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${request.userId}`).emit('repair_request:update', request);
      // If we had a provider dashboard, we would also emit to the provider's room here
    }

    // 2. Send notification
    await notificationService.sendNotification({
      userId: request.userId,
      type: 'repair_request_status_change',
      message: `Your service request for ${request.providerId?.name || 'a provider'} has been Cancelled.`,
      relatedContentId: request._id
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add a note to a request
// @route   PUT /api/repair/requests/:id/note
// @access  Private
exports.addRequestNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note) {
      return res.status(400).json({ success: false, error: 'Note content is required' });
    }

    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Append to existing notes or set new
    request.notes = request.notes ? `${request.notes}\n[${new Date().toISOString()}] User: ${note}` : `[${new Date().toISOString()}] User: ${note}`;
    
    await request.save();

    // 1. Emit real-time UI update
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${request.userId}`).emit('repair_request:update', request);
    }

    // 2. We only notify the user if the note was added by someone else.
    // In this MVP, the user is adding the note, so we don't notify them.
    // If a provider added the note, it would look like:
    /*
    await notificationService.sendNotification({
      userId: request.userId,
      type: 'repair_request_note',
      message: `A new note was added to your service request.`,
      relatedContentId: request._id
    });
    */

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Report a provider
// @route   POST /api/repair/:id/report
// @access  Private
exports.reportProvider = async (req, res) => {
  try {
    const { reasonCategory, details } = req.body;
    const providerId = req.params.id;
    const userId = req.user.id;

    if (!reasonCategory) {
      return res.status(400).json({ success: false, error: 'Reason category is required.' });
    }

    // Deduplication check: Has this user reported this provider in the last 24 hours?
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReport = await ProviderReport.findOne({
      providerId,
      reportedBy: userId,
      createdAt: { $gte: oneDayAgo }
    });

    if (recentReport) {
      return res.status(429).json({ 
        success: false, 
        error: 'You have already submitted a report for this provider recently.' 
      });
    }

    const report = await ProviderReport.create({
      providerId,
      reportedBy: userId,
      reasonCategory,
      details
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('Error reporting provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update a request status (Provider/Admin action)
// @route   PUT /api/repair/requests/:id/status
// @access  Private
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    request.status = status;
    request.statusHistory.push({
      status,
      changedBy: req.user.id
    });
    
    await request.save();

    // Trigger async stats recalculation for the provider
    ProviderStatsService.recalculateStats(request.providerId).catch(err => console.error('Failed to recalc stats:', err));

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Toggle saving a provider
// @route   POST /api/repair/:id/save
// @access  Private
exports.toggleSaveProvider = async (req, res) => {
  try {
    const providerId = req.params.id;
    const userId = req.user.id;

    const provider = await RepairProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    const existingSave = await SavedProvider.findOne({ userId, providerId });
    if (existingSave) {
      // Toggle off (remove)
      await existingSave.deleteOne();
      return res.status(200).json({ success: true, isSaved: false, message: 'Provider removed from saved list' });
    }

    // Toggle on (create)
    await SavedProvider.create({ userId, providerId });
    recommendationsCache.delete(userId);
    res.status(200).json({ success: true, isSaved: true, message: 'Provider saved' });
  } catch (error) {
    console.error('Error toggling save provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user's saved providers
// @route   GET /api/repair/saved
// @access  Private
exports.getSavedProviders = async (req, res) => {
  try {
    const saved = await SavedProvider.find({ userId: req.user.id })
      .populate({
        path: 'providerId',
        select: 'name category priceIndicator location badges rating reviewsCount createdAt verification reputationStats manualStatusOverride operatingHours'
      })
      .sort('-createdAt');

    // Filter out nulls (deleted providers) and map cleanly
    const formatted = saved
      .filter(s => s.providerId)
      .map(s => {
        const pObj = s.providerId.toObject();
        pObj.availability = calculateAvailability(pObj);
        pObj.isSaved = true;
        pObj.id = pObj._id;
        delete pObj.operatingHours;
        return pObj;
      });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error getting saved providers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get personalized recommendations
// @route   GET /api/repair/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check Cache
    const cached = recommendationsCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json({ success: true, data: cached.data });
    }

    // 1. Gather historical categories
    const requests = await RepairRequest.find({ userId }).populate('providerId', 'category');
    const saved = await SavedProvider.find({ userId }).populate('providerId', 'category');

    let categorySet = new Set();
    let interactedProviderIds = new Set();

    requests.forEach(req => {
      if (req.providerId) {
        categorySet.add(req.providerId.category);
        interactedProviderIds.add(req.providerId._id.toString());
      }
    });

    saved.forEach(s => {
      if (s.providerId) {
        categorySet.add(s.providerId.category);
        interactedProviderIds.add(s.providerId._id.toString());
      }
    });

    let recommendedProviders = [];
    
    if (categorySet.size > 0) {
      // Find top-rated providers in these categories that the user hasn't interacted with
      recommendedProviders = await RepairProvider.find({
        category: { $in: Array.from(categorySet) },
        _id: { $nin: Array.from(interactedProviderIds) },
        rating: { $gte: 4.0 }
      })
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(6)
      .select('name category description services priceIndicator basePrice location rating reviewsCount verification badges operatingHours manualStatusOverride');
    }

    // Fallback if no history or no matches in categories
    if (recommendedProviders.length === 0) {
      recommendedProviders = await RepairProvider.find({
        _id: { $nin: Array.from(interactedProviderIds) }
      })
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(6)
      .select('name category description services priceIndicator basePrice location rating reviewsCount verification badges operatingHours manualStatusOverride');
    }

    const mapped = recommendedProviders.map(p => {
      const pObj = p.toObject();
      pObj.availability = calculateAvailability(pObj);
      pObj.isSaved = false; // By definition, recommendations exclude saved providers
      pObj.id = pObj._id;
      delete pObj.operatingHours;
      delete pObj.manualStatusOverride;
      
      if (pObj.services && pObj.services.length > 3) {
        pObj.services = pObj.services.slice(0, 3);
      }
      
      if (pObj.location && pObj.location.coordinates) {
         delete pObj.location.coordinates;
      }
      
      return pObj;
    });

    recommendationsCache.set(userId, { timestamp: Date.now(), data: mapped });

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
