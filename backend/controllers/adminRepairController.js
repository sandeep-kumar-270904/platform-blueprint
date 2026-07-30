const RepairProvider = require('../models/RepairProvider');
const RepairReview = require('../models/RepairReview');
const RepairRequest = require('../models/RepairRequest');
const ProviderReport = require('../models/ProviderReport');
const VerificationAuditLog = require('../models/VerificationAuditLog');
const AdminActionLog = require('../models/AdminActionLog'); // Assumes this exists based on Admin Panel patterns
const notificationService = require('../services/notificationService');

// Simple TTL Cache for Analytics
const analyticsCache = {
  timestamp: 0,
  data: null
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// @desc    Get all providers for admin (including deactivated)
// @route   GET /api/admin/repair/providers
// @access  Private/Admin
exports.getAdminProviders = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (status) {
      if (status === 'active') query.isActive = true;
      if (status === 'deactivated') query.isActive = false;
    }

    const providers = await RepairProvider.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    console.error('Error fetching admin providers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new repair provider (Admin)
// @route   POST /api/admin/repair/providers
// @access  Private/Admin
exports.createProvider = async (req, res) => {
  try {
    const provider = await RepairProvider.create(req.body);
    // Clear analytics cache
    analyticsCache.timestamp = 0;
    res.status(201).json({ success: true, data: provider });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update repair provider
// @route   PUT /api/admin/repair/providers/:id
// @access  Private/Admin
exports.updateProvider = async (req, res) => {
  try {
    const provider = await RepairProvider.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });
    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Deactivate (soft-delete) provider
// @route   PUT /api/admin/repair/providers/:id/deactivate
// @access  Private/Admin
exports.deactivateProvider = async (req, res) => {
  try {
    const provider = await RepairProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

    provider.isActive = false;
    await provider.save();

    // Auto-transition pending/accepted requests to Cancelled
    const requests = await RepairRequest.find({
      providerId: provider._id,
      status: { $in: ['Pending', 'Accepted'] }
    });

    for (let request of requests) {
      request.status = 'Cancelled';
      request.statusHistory.push({
        status: 'Cancelled',
        changedBy: req.user.id,
        note: 'System Auto-Cancel: Provider deactivated by Admin.'
      });
      await request.save();
      
      // Notify user
      await notificationService.createNotification({
        userId: request.userId,
        type: 'repair_request_cancelled',
        relatedContentId: request._id,
        message: `Your service request for ${provider.name} was cancelled because the provider is no longer active.`
      });
    }

    analyticsCache.timestamp = 0;
    res.status(200).json({ success: true, data: provider, cancelledRequestsCount: requests.length });
  } catch (error) {
    console.error('Error deactivating provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Toggle provider verification elements
// @route   PUT /api/admin/repair/providers/:id/verify
// @access  Private/Admin
exports.verifyProvider = async (req, res) => {
  try {
    const { isVerified, businessRegistration, phoneNumber, address, idProof } = req.body;
    const provider = await RepairProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

    // Build diff for audit log
    const changedFields = [];
    if (businessRegistration !== undefined && provider.verification.businessRegistration !== businessRegistration) {
      changedFields.push(`businessRegistration: ${provider.verification.businessRegistration} -> ${businessRegistration}`);
      provider.verification.businessRegistration = businessRegistration;
    }
    if (phoneNumber !== undefined && provider.verification.phoneNumber !== phoneNumber) {
      changedFields.push(`phoneNumber: ${provider.verification.phoneNumber} -> ${phoneNumber}`);
      provider.verification.phoneNumber = phoneNumber;
    }
    if (address !== undefined && provider.verification.address !== address) {
      changedFields.push(`address: ${provider.verification.address} -> ${address}`);
      provider.verification.address = address;
    }
    if (idProof !== undefined && provider.verification.idProof !== idProof) {
      changedFields.push(`idProof: ${provider.verification.idProof} -> ${idProof}`);
      provider.verification.idProof = idProof;
    }
    
    if (isVerified !== undefined && provider.verification.isVerified !== isVerified) {
      changedFields.push(`isVerified: ${provider.verification.isVerified} -> ${isVerified}`);
      provider.verification.isVerified = isVerified;
      provider.verification.verifiedAt = isVerified ? Date.now() : null;
    }

    await provider.save();

    if (changedFields.length > 0) {
      await VerificationAuditLog.create({
        providerId: provider._id,
        adminId: req.user.id,
        action: 'Verification Update',
        details: changedFields.join(', ')
      });
    }

    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    console.error('Error verifying provider:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Moderation Queue (Provider & Review Reports)
// @route   GET /api/admin/repair/reports
// @access  Private/Admin
exports.getReports = async (req, res) => {
  try {
    const { status, type } = req.query; // type: 'provider' | 'review'
    let query = {};
    if (status && status !== 'all') query.status = status;

    let providerReports = [];
    let reviewReports = [];

    if (!type || type === 'provider') {
      providerReports = await ProviderReport.find(query)
        .populate('providerId', 'name category')
        .populate('reportedBy', 'username email')
        .sort({ createdAt: -1 });
    }

    if (!type || type === 'review') {
      let revQuery = {};
      if (status) {
        if (status === 'Open') revQuery.moderationStatus = 'flagged';
        if (status === 'Resolved' || status === 'Dismissed') revQuery.moderationStatus = 'active'; // Simplified
        if (status === 'removed') revQuery.moderationStatus = 'removed';
      } else {
        revQuery.moderationStatus = 'flagged';
      }
      
      const flaggedReviews = await RepairReview.find(revQuery)
        .populate('providerId', 'name')
        .populate('userId', 'username email')
        .sort({ flagsCount: -1, createdAt: -1 });
      
      reviewReports = flaggedReviews;
    }

    res.status(200).json({ 
      success: true, 
      data: {
        providerReports,
        reviewReports
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update Provider Report Status
// @route   PUT /api/admin/repair/reports/:id/status
// @access  Private/Admin
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    const report = await ProviderReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });

    report.status = status;
    if (resolutionNote) report.resolutionNote = resolutionNote;
    await report.save();

    // Log admin action
    if (AdminActionLog) {
      await AdminActionLog.create({
        admin_id: req.user.id,
        action_type: 'UPDATE_PROVIDER_REPORT',
        target_id: report._id,
        details: { status, resolutionNote }
      }).catch(err => console.error("Could not log admin action", err));
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Hide/Remove a Review
// @route   PUT /api/admin/repair/reviews/:id/hide
// @access  Private/Admin
exports.hideReview = async (req, res) => {
  try {
    const review = await RepairReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

    review.moderationStatus = 'removed';
    await review.save(); // triggers post-save hook to recalculate provider rating

    if (AdminActionLog) {
      await AdminActionLog.create({
        admin_id: req.user.id,
        action_type: 'REMOVE_REPAIR_REVIEW',
        target_id: review._id
      }).catch(err => console.error("Could not log admin action", err));
    }
    
    analyticsCache.timestamp = 0;
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('Error hiding review:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all service requests (Admin Overview)
// @route   GET /api/admin/repair/requests
// @access  Private/Admin
exports.getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const requests = await RepairRequest.find(query)
      .populate('providerId', 'name category')
      .populate('userId', 'username email full_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await RepairRequest.countDocuments(query);

    res.status(200).json({ 
      success: true, 
      count: requests.length,
      total,
      totalPages: Math.ceil(total / limit),
      data: requests 
    });
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Admin Analytics
// @route   GET /api/admin/repair/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    if (Date.now() - analyticsCache.timestamp < CACHE_TTL && analyticsCache.data) {
      return res.status(200).json({ success: true, data: analyticsCache.data });
    }

    const [
      totalProviders,
      providersByCategory,
      avgRatingAgg,
      requestsByStatus,
      topReportedProviders
    ] = await Promise.all([
      RepairProvider.countDocuments({ isActive: { $ne: false } }),
      RepairProvider.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]),
      RepairProvider.aggregate([
        { $match: { isActive: { $ne: false }, rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } }
      ]),
      RepairRequest.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      ProviderReport.aggregate([
        { $match: { status: { $ne: 'Dismissed' } } },
        { $group: { _id: "$providerId", reportCount: { $sum: 1 } } },
        { $sort: { reportCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'repairproviders', localField: '_id', foreignField: '_id', as: 'provider' } },
        { $unwind: "$provider" },
        { $project: { reportCount: 1, "provider.name": 1, "provider.category": 1 } }
      ])
    ]);

    const data = {
      totalProviders,
      providersByCategory: providersByCategory.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      globalAverageRating: avgRatingAgg.length > 0 ? Number(avgRatingAgg[0].avgRating.toFixed(2)) : 0,
      requestsByStatus: requestsByStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      topReportedProviders
    };

    analyticsCache.timestamp = Date.now();
    analyticsCache.data = data;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
