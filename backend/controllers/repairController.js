const mongoose = require('mongoose');
const RepairProvider = require('../models/RepairProvider');
const ProviderReport = require('../models/ProviderReport');
const SavedProvider = require('../models/SavedProvider');
const RepairRequest = require('../models/RepairRequest');
const RepairReview = require('../models/RepairReview');
const QuoteRequest = require('../models/QuoteRequest');
const QuoteResponse = require('../models/QuoteResponse');
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

    let query = { isActive: { $ne: false } };
    
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

    const locale = req.query.locale || 'en';

    const mappedProviders = providers.map(p => {
      const pObj = p.toObject();
      pObj.availability = calculateAvailability(pObj);
      pObj.isSaved = savedProviderIds.has(pObj._id.toString());
      
      // Phase 19: Apply Locale Fallback
      if (locale !== pObj.defaultLocale && pObj.localizedContent && pObj.localizedContent[locale]) {
        const locData = pObj.localizedContent[locale];
        if (locData.name) pObj.name = locData.name;
        if (locData.description) pObj.description = locData.description;
        if (locData.services) pObj.services = locData.services;
        pObj.isFallbackLocale = false;
      } else {
        pObj.isFallbackLocale = (locale !== pObj.defaultLocale);
      }

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

// ==========================================
// EXPORT & GDPR ENDPOINTS
// ==========================================

// @desc    Export all user's repair data
// @route   GET /api/repair/export
// @access  Private
exports.exportRepairData = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await RepairRequest.find({ userId });
    const quotes = await QuoteRequest.find({ userId });
    const reviews = await RepairReview.find({ userId });
    const saved = await SavedProvider.find({ userId }).populate('providerId', 'name category');

    const exportData = {
      timestamp: new Date(),
      user: userId,
      requests,
      quotes,
      reviews,
      savedProviders: saved
    };

    res.status(200).json({ success: true, data: exportData });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// ==========================================
// REVIEW EDIT/DELETE ENDPOINTS
// ==========================================

// @desc    Update a review
// @route   PUT /api/repair/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body;
    let review = await RepairReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    if (review.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to update this review' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    if (images) review.images = images;
    
    await review.save();
    
    // Recalculate provider stats
    await ProviderStatsService.recalculateStats(review.providerId);

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/repair/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await RepairReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    if (review.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this review' });
    }

    const providerId = review.providerId;
    await RepairReview.deleteOne({ _id: req.params.id });
    
    // Recalculate provider stats
    await ProviderStatsService.recalculateStats(providerId);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// @desc    Get all providers for admin
// @route   GET /api/repair/admin/providers
// @access  Private/Admin
exports.getAdminProviders = async (req, res) => {
  try {
    // Basic search and filtering for admin panel
    const { search, status } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status === 'pending') query['verification.isVerified'] = false;
    
    const providers = await RepairProvider.find(query).sort('-createdAt').limit(100);
    res.status(200).json({ success: true, data: providers });
  } catch (error) {
    console.error('Error fetching admin providers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Verify a provider
// @route   PUT /api/repair/admin/providers/:id/verify
// @access  Private/Admin
exports.verifyProvider = async (req, res) => {
  try {
    const provider = await RepairProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    provider.verification.isVerified = true;
    provider.verification.verifiedAt = new Date();
    provider.verification.businessRegistration = true;
    provider.verification.phoneNumber = true;
    provider.verification.address = true;
    provider.verification.idProof = true;
    
    await provider.save();
    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    console.error('Error verifying provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all reports for admin
// @route   GET /api/repair/admin/reports
// @access  Private/Admin
exports.getAdminReports = async (req, res) => {
  try {
    const ProviderReport = require('../models/ProviderReport');
    const reports = await ProviderReport.find({ status: 'Open' })
      .populate('providerId', 'name')
      .populate('reportedBy', 'name email')
      .sort('createdAt');
      
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Resolve a report
// @route   PUT /api/repair/admin/reports/:id/resolve
// @access  Private/Admin
exports.resolveReport = async (req, res) => {
  try {
    const ProviderReport = require('../models/ProviderReport');
    const report = await ProviderReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.status = req.body.status || 'Resolved';
    report.resolutionNote = req.body.resolutionNote;
    await report.save();
    
    // Optionally suspend provider based on report (simplified logic)
    if (req.body.suspendProvider) {
      await RepairProvider.findByIdAndUpdate(report.providerId, { isActive: false });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

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

    // Phase 19: Apply Locale Fallback
    const locale = req.query.locale || 'en';
    if (locale !== pObj.defaultLocale && pObj.localizedContent && pObj.localizedContent[locale]) {
      const locData = pObj.localizedContent[locale];
      if (locData.name) pObj.name = locData.name;
      if (locData.description) pObj.description = locData.description;
      if (locData.services) pObj.services = locData.services;
      pObj.isFallbackLocale = false;
    } else {
      pObj.isFallbackLocale = (locale !== pObj.defaultLocale);
    }

    if (req.user) {
      const saved = await SavedProvider.findOne({ userId: req.user.id, providerId: pObj._id });
      pObj.isSaved = !!saved;
      
      // Phase 18: Regular Customer Check
      const RepairRequest = require('../models/RepairRequest');
      const userCompletedCount = await RepairRequest.countDocuments({
        providerId: pObj._id,
        userId: req.user.id,
        status: 'Completed'
      });
      pObj.isRegularCustomer = userCompletedCount >= 2;
    } else {
      pObj.isSaved = false;
      pObj.isRegularCustomer = false;
    }

    const RepairRequest = require('../models/RepairRequest');
    const completedJobsCount = await RepairRequest.countDocuments({
      providerId: pObj._id,
      status: 'Completed'
    });
    
    // Explicitly return null or 'none' if 0 so frontend can render correctly
    pObj.completedJobsCount = completedJobsCount === 0 ? null : completedJobsCount;

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

    // Boundary Validation
    if (rating < 1 || rating > 5 || isNaN(rating)) {
      return res.status(400).json({ success: false, error: 'Rating must be a number between 1 and 5' });
    }
    if (comment && comment.length > 2000) {
      return res.status(400).json({ success: false, error: 'Review comment is too long (max 2000 chars)' });
    }

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
const ProviderApplication = require('../models/ProviderApplication');
const RepairSlotHold = require('../models/RepairSlotHold');
const crypto = require('crypto');

// @desc    Submit a provider application (interest capture)
// @route   POST /api/repair/applications
// @access  Private (or Public, but we'll use optionalAuth/protect if we want to tie it to a user. Let's assume protect for now)
exports.submitProviderApplication = async (req, res) => {
  try {
    const { businessName, category, contactPhone, contactEmail, serviceArea, description } = req.body;

    // Basic validation
    if (!businessName || !category || !contactPhone || !contactEmail || !serviceArea || !description) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    // Idempotency: Prevent duplicate rapid-fire submissions (same business name + phone in last 5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    const existingApp = await ProviderApplication.findOne({
      businessName,
      contactPhone,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existingApp) {
      return res.status(429).json({ success: false, error: 'Application already submitted recently. Please wait before submitting again.' });
    }

    // Generate unique reference ID
    const referenceId = 'APP-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const application = await ProviderApplication.create({
      businessName,
      category,
      contactPhone,
      contactEmail,
      serviceArea,
      description,
      referenceId,
      submittedBy: req.user ? req.user.id : null
    });

    res.status(201).json({ success: true, data: { referenceId: application.referenceId, status: application.status } });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
};

// @desc    Get provider slots for a date range
// @route   GET /api/repair/providers/:id/slots
// @access  Public (or OptionalAuth)
exports.getProviderSlots = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const providerId = req.params.id;
    
    const provider = await RepairProvider.findById(providerId);
    if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });
    
    const slotDuration = provider.schedulingConfig?.slotDurationMinutes || 0;
    if (slotDuration === 0) {
      // Provider does not support strict slots, frontend should fallback to freeform
      return res.status(200).json({ success: true, data: { slotsEnabled: false } });
    }
    
    // Fetch active holds for this provider in the date range
    const activeHolds = await RepairSlotHold.find({
      providerId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['held', 'confirmed'] }
    }).lean();
    
    const holdsMap = {};
    activeHolds.forEach(h => {
      const key = `${h.date}_${h.time}`;
      holdsMap[key] = true;
    });
    
    // We would dynamically generate slots here by intersecting operating hours with holdsMap.
    // For prototype purposes, we return a mock list of generated slots for requested days.
    // In a real app, you iterate from startDate to endDate, checking operatingHours per day.
    
    const generatedSlots = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      const dayHours = provider.operatingHours.find(h => h.day === dayOfWeek);
      if (dayHours && dayHours.isOpen) {
        // Mock generating slots every slotDuration minutes between openTime and closeTime
        let [openHr, openMin] = dayHours.openTime.split(':').map(Number);
        const [closeHr, closeMin] = dayHours.closeTime.split(':').map(Number);
        
        let currentMins = openHr * 60 + openMin;
        const closeMins = closeHr * 60 + closeMin;
        
        while (currentMins + slotDuration <= closeMins) {
          const hr = Math.floor(currentMins / 60).toString().padStart(2, '0');
          const min = (currentMins % 60).toString().padStart(2, '0');
          const timeStr = `${hr}:${min}`;
          
          if (!holdsMap[`${dateStr}_${timeStr}`]) {
            generatedSlots.push({ date: dateStr, time: timeStr });
          }
          currentMins += slotDuration;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.status(200).json({ success: true, data: { slotsEnabled: true, slots: generatedSlots } });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create a new repair request
// @route   POST /api/repair/requests
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { providerId, issueDescription, quickIssueCategory, preferredDate, preferredTime, isAsap, isUrgent, contactPhone, slotDate, slotTime } = req.body;
    
    // Boundary validations
    if (issueDescription && issueDescription.length > 3000) {
      return res.status(400).json({ success: false, error: 'Issue description is too long (max 3000 chars)' });
    }
    if (contactPhone && contactPhone.length > 20) {
      return res.status(400).json({ success: false, error: 'Phone number is too long' });
    }

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

    // Atomic slot hold check
    let slotHold = null;
    if (slotDate && slotTime) {
      try {
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hour hold
        slotHold = await RepairSlotHold.create({
          providerId,
          userId: req.user.id,
          date: slotDate,
          time: slotTime,
          status: 'held',
          expiresAt
        });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ success: false, error: 'This time slot is no longer available. Please select another.' });
        }
        throw err;
      }
    }

    const finalDate = slotDate ? new Date(slotDate) : (preferredDate ? new Date(preferredDate) : null);
    const finalTime = slotTime ? slotTime : (isAsap ? 'ASAP' : preferredTime);

    const newRequest = await RepairRequest.create({
      providerId,
      userId: req.user.id,
      issueDescription,
      quickIssueCategory,
      preferredDate: finalDate,
      preferredTime: finalTime,
      isAsap: isAsap === 'true' || isAsap === true,
      isUrgent: isUrgent === 'true' || isUrgent === true,
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

    if (slotHold) {
      slotHold.requestId = newRequest._id;
      await slotHold.save();
    }

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
    const { status, sort } = req.query;
    let query = { userId: req.user.id };
    
    if (status) {
      query.status = status;
    }

    let sortOption = '-createdAt';
    if (sort === 'urgent') {
      sortOption = { isUrgent: -1, createdAt: -1 };
    }

    const requests = await RepairRequest.find(query)
      .populate('providerId', 'name category')
      .sort(sortOption);

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

// @desc    Get rebook data for a past request
// @route   GET /api/repair/requests/:id/rebook
// @access  Private
exports.getRebookData = async (req, res) => {
  try {
    const request = await RepairRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    if (request.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    if (request.status !== 'Completed') {
      return res.status(400).json({ success: false, error: 'Can only rebook completed requests' });
    }

    const provider = await RepairProvider.findById(request.providerId);
    let providerStatus = { isActive: false };
    if (provider) {
      const pObj = provider.toObject();
      pObj.availability = calculateAvailability(pObj);
      providerStatus = {
        isActive: pObj.isActive,
        availability: pObj.availability,
        responseRate: pObj.reputationStats?.responseRate,
        name: pObj.name
      };
    }

    res.status(200).json({
      success: true,
      data: {
        category: request.quickIssueCategory,
        issueDescription: request.issueDescription,
        notes: request.notes,
        providerStatus
      }
    });
  } catch (error) {
    console.error('Error fetching rebook data:', error);
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

    // Release any held slots immediately
    const mongoose = require('mongoose');
    await mongoose.model('ProviderSlotHold').deleteMany({ requestId: request._id });

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

    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    console.error('Error reporting provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user dashboard summary for Repair & Maintenance
// @route   GET /api/repair/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch active service requests (Pending, Accepted, In Progress)
    const activeRequests = await RepairRequest.find({
      userId,
      status: { $in: ['Pending', 'Accepted', 'In Progress'] }
    })
    .populate('providerId', 'name category location verification')
    .sort({ isUrgent: -1, createdAt: -1 })
    .limit(5);

    // 2. Fetch count of saved providers
    const savedProvidersCount = await SavedProvider.countDocuments({ userId });

    // 3. Find pending reviews
    // Get all completed requests for this user that haven't had the prompt dismissed
    const completedRequests = await RepairRequest.find({
      userId,
      status: 'Completed',
      dashboardPromptDismissed: { $ne: true }
    }).populate('providerId', 'name category').sort({ createdAt: -1 }).limit(10); // Check last 10 completed

    const pendingReviews = [];
    for (const req of completedRequests) {
      if (req.providerId) {
        // Check if a review already exists for this provider by this user
        const existingReview = await RepairReview.findOne({
          providerId: req.providerId._id,
          userId: userId
        });
        
        if (!existingReview) {
          // Check if we already added this provider to the pending reviews list
          if (!pendingReviews.some(p => p.providerId._id.toString() === req.providerId._id.toString())) {
            pendingReviews.push({
              requestId: req._id,
              providerId: req.providerId,
              completedAt: req.updatedAt // Using updatedAt as proxy for completion time
            });
          }
        }
      }
    }
    
    const pastRequests = await RepairRequest.find({
      userId: req.user.id,
      status: 'Completed'
    })
    .sort('-updatedAt')
    .limit(5)
    .populate('providerId', 'name category');

    res.status(200).json({
      success: true,
      data: {
        activeRequests,
        pastRequests,
        savedProvidersCount,
        pendingReviews: pendingReviews.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Dismiss review prompt for a request
// @route   PUT /api/repair/requests/:id/dismiss-prompt
// @access  Private
exports.dismissReviewPrompt = async (req, res) => {
  try {
    const request = await RepairRequest.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    request.dashboardPromptDismissed = true;
    await request.save();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error dismissing prompt:', error);
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
        rating: { $gte: 4.0 },
        isActive: { $ne: false }
      })
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(6)
      .select('name category description services priceIndicator basePrice location rating reviewsCount verification badges operatingHours manualStatusOverride');
    }

    // Fallback if no history or no matches in categories
    if (recommendedProviders.length === 0) {
      recommendedProviders = await RepairProvider.find({
        _id: { $nin: Array.from(interactedProviderIds) },
        isActive: { $ne: false }
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

// @desc    Get urgency sanity configuration
// @route   GET /api/repair/urgency-config
// @access  Public
exports.getUrgencyConfig = (req, res) => {
  // Static configuration defining which categories typically warrant "Urgent" status
  // This allows the frontend to gently discourage urgency for non-critical categories
  const urgencyConfig = {
    eligibleCategories: ['plumbing', 'electrical', 'ac', 'appliance', 'security'],
    warningMessage: 'Are you sure this is urgent? This category typically handles standard requests. Urgent requests should be reserved for critical issues.',
    plumbing: ['leak', 'burst', 'flooding', 'no water'],
    electrical: ['outage', 'spark', 'shock', 'burnt smell'],
    ac: ['not cooling', 'leaking', 'making noise'],
    security: ['broken lock', 'stuck door', 'alarm issues']
  };

  res.status(200).json({ success: true, data: urgencyConfig });
};

// @desc    Submit a new broadcast quote request
// @route   POST /api/repair/quotes
// @access  Private
exports.createQuoteRequest = async (req, res) => {
  try {
    const { category, issueDescription, budgetRange, isUrgent, lat, lng } = req.body;
    let photoUrl = null;

    if (issueDescription && issueDescription.length > 3000) {
      return res.status(400).json({ success: false, error: 'Issue description is too long (max 3000 chars)' });
    }


    if (req.file) {
      photoUrl = `/uploads/repair/${req.file.filename}`;
    }

    // Determine matching criteria
    let query = { isActive: { $ne: false } };
    
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    // Example Budget Mapping (adjust based on UI predefined ranges)
    if (budgetRange) {
      if (budgetRange.includes('$0 - $50')) query.basePrice = { $lte: 50 };
      else if (budgetRange.includes('$50 - $150')) query.basePrice = { $gte: 50, $lte: 150 };
      else if (budgetRange.includes('$150 - $300')) query.basePrice = { $gte: 150, $lte: 300 };
      else if (budgetRange.includes('$300+')) query.basePrice = { $gte: 300 };
    }

    // Location matching if provided
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        query["location.coordinates"] = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            $maxDistance: 50000 // 50km radius
          }
        };
      }
    }

    // Find top 10 matching providers
    const matchedProviders = await RepairProvider.find(query).limit(10).select('_id userId name');

    if (matchedProviders.length === 0) {
      // Create request but mark as having 0 matches immediately
      const quoteRequest = await QuoteRequest.create({
        userId: req.user._id,
        category,
        issueDescription,
        budgetRange,
        isUrgent,
        photoUrl,
        status: 'Open',
        location: (lat && lng) ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined
      });

      return res.status(201).json({ success: true, matches: 0, data: quoteRequest });
    }

    // Create the quote request
    const quoteRequest = await QuoteRequest.create({
      userId: req.user._id,
      category,
      issueDescription,
      budgetRange,
      isUrgent,
      photoUrl,
      status: 'Open',
      location: (lat && lng) ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined
    });

    // Notify matched providers
    const notificationPromises = matchedProviders.map(provider => {
      // Assuming provider has a linked userId. For mocked data without userId, this safely does nothing.
      if (provider.userId) {
        return notificationService.notifyUser(provider.userId, {
          title: 'New Quote Request',
          message: `A new ${category} quote request matches your profile.`,
          type: 'repair_update',
          link: `/repair-pro/quotes/${quoteRequest._id}` // Example provider dashboard link
        });
      }
      return Promise.resolve();
    });

    await Promise.all(notificationPromises);

    res.status(201).json({ success: true, matches: matchedProviders.length, data: quoteRequest });
  } catch (error) {
    console.error('Error creating quote request:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get active quote requests and their nested responses for the user
// @route   GET /api/repair/quotes
// @access  Private
exports.getMyQuoteRequests = async (req, res) => {
  try {
    const quoteRequests = await QuoteRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const quoteIds = quoteRequests.map(qr => qr._id);
    const responses = await QuoteResponse.find({ quoteRequestId: { $in: quoteIds } })
      .populate('providerId', 'name rating reviewsCount category')
      .lean();

    // Attach responses to their respective quote requests
    quoteRequests.forEach(qr => {
      qr.responses = responses.filter(r => r.quoteRequestId.toString() === qr._id.toString());
    });

    res.status(200).json({ success: true, data: quoteRequests });
  } catch (error) {
    console.error('Error getting quote requests:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Cancel a quote request
// @route   PUT /api/repair/quotes/:id/cancel
// @access  Private
exports.cancelQuoteRequest = async (req, res) => {
  try {
    const quoteRequest = await QuoteRequest.findById(req.params.id);
    if (!quoteRequest) {
      return res.status(404).json({ success: false, message: 'Quote request not found' });
    }
    if (quoteRequest.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    quoteRequest.status = 'Cancelled';
    await quoteRequest.save();

    // Mark all pending responses as Rejected
    await QuoteResponse.updateMany(
      { quoteRequestId: quoteRequest._id, status: 'Pending' },
      { $set: { status: 'Rejected' } }
    );

    res.status(200).json({ success: true, data: quoteRequest });
  } catch (error) {
    console.error('Error cancelling quote request:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Close a quote request (stop accepting new quotes)
// @route   PUT /api/repair/quotes/:id/close
// @access  Private
exports.closeQuoteRequest = async (req, res) => {
  try {
    const quoteRequest = await QuoteRequest.findById(req.params.id);
    if (!quoteRequest) {
      return res.status(404).json({ success: false, message: 'Quote request not found' });
    }
    if (quoteRequest.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    quoteRequest.status = 'Closed';
    await quoteRequest.save();

    res.status(200).json({ success: true, data: quoteRequest });
  } catch (error) {
    console.error('Error closing quote request:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Accept a specific quote
// @route   POST /api/repair/quotes/:quoteId/accept
// @access  Private
exports.acceptQuoteResponse = async (req, res) => {
  const session = await mongoose.startSession();
  let repairRequest = null;

  try {
    await session.withTransaction(async () => {
      const quoteResponse = await QuoteResponse.findById(req.params.quoteId).populate('providerId').session(session);
      if (!quoteResponse) {
        throw new Error('Quote response not found');
      }

      const quoteRequest = await QuoteRequest.findById(quoteResponse.quoteRequestId).session(session);
      if (!quoteRequest) {
        throw new Error('Quote request not found');
      }
      
      if (quoteRequest.userId.toString() !== req.user._id.toString()) {
        throw new Error('Not authorized');
      }

      if (!['Open', 'Closed-Awaiting-Decision'].includes(quoteRequest.status)) {
        throw new Error('This quote request is no longer open or awaiting decision');
      }

      if (quoteResponse.status !== 'Pending') {
        throw new Error('This quote is no longer pending');
      }

      // Mark this response as accepted
      quoteResponse.status = 'Accepted';
      await quoteResponse.save({ session });

      // Decline all other pending responses for this request
      const otherResponses = await QuoteResponse.find({ 
        quoteRequestId: quoteRequest._id, 
        _id: { $ne: quoteResponse._id },
        status: 'Pending'
      }).session(session);

      for (const other of otherResponses) {
        other.status = 'Declined-by-user';
        await other.save({ session });

        // Notify other providers
        if (other.providerId.userId) { // Assuming provider has a userId ref, safely fail if mocked
          await notificationService.notifyUser(other.providerId.userId, {
            title: 'Quote Not Selected',
            message: `Your quote for the ${quoteRequest.category} request was not selected by the user.`,
            type: 'repair_update'
          });
        }
      }

      // Mark the request as Accepted
      quoteRequest.status = 'Accepted';
      await quoteRequest.save({ session });

      // Create a normal RepairRequest
      repairRequest = await RepairRequest.create([{
        providerId: quoteResponse.providerId._id,
        userId: req.user._id,
        issueDescription: quoteRequest.issueDescription,
        quickIssueCategory: quoteRequest.category,
        preferredTime: 'ASAP', // Since they accepted a timeframe from the quote
        isAsap: true,
        isUrgent: quoteRequest.isUrgent,
        photoUrl: quoteRequest.photoUrl,
        contactSnapshot: { phone: req.user.phone || '000-000-0000', email: req.user.email },
        status: 'Accepted', // Auto-accepted since provider already quoted
        notes: `Accepted Quote: ${quoteResponse.priceEstimate}. Provider note: ${quoteResponse.note}`,
        statusHistory: [{ status: 'Accepted', systemNote: 'Created from accepted quote' }]
      }], { session });

      // Notify the winning provider
      if (quoteResponse.providerId.userId) {
        await notificationService.notifyUser(quoteResponse.providerId.userId, {
          title: 'Quote Accepted!',
          message: `Your quote for the ${quoteRequest.category} request was accepted!`,
          type: 'repair_update',
          link: `/repair-pro/requests/${repairRequest[0]._id}`
        });
      }
    });

    session.endSession();
    res.status(200).json({ success: true, data: repairRequest[0] });
  } catch (error) {
    session.endSession();
    console.error('Error accepting quote:', error);
    const status = (error.message === 'Not authorized') ? 401 : (error.message.includes('not found') ? 404 : 400);
    res.status(status).json({ success: false, message: error.message || 'Server error' });
  }
};

