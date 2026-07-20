const ProviderFeedback = require('../models/ProviderFeedback');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const Scholarship = require('../models/Scholarship');

exports.submitFeedback = async (req, res) => {
  try {
    const { wasClear, requirementsAccurate, confusingSteps } = req.body;
    const { appId } = req.params;

    const application = await ScholarshipApplication.findOne({ _id: appId, userId: req.user.id });
    if (!application) {
      return res.status(404).json({ message: 'Application not found or unauthorized' });
    }

    if (!['submitted', 'under_review', 'awarded', 'rejected', 'link_opened'].includes(application.status)) {
      return res.status(400).json({ message: 'Application must be in a post-completion state' });
    }

    const feedback = new ProviderFeedback({
      scholarshipId: application.scholarshipId,
      applicationId: application._id,
      submittedBy: req.user.id,
      wasClear,
      requirementsAccurate,
      confusingSteps
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getRawFeedback = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    // Ensure user is the provider or an admin
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);
    const isProvider = scholarship.submittedBy && scholarship.submittedBy.toString() === req.user.id;
    
    // Also support institution-level provider auth (Phase 7)
    // If scholarship.institutionAllocation exists, any admin of that institution can view
    const isInstitutionProvider = req.user.institutionId && scholarship.institutionAllocation && 
                                  scholarship.institutionAllocation.institutionId.toString() === req.user.institutionId;

    if (!isAdmin && !isProvider && !isInstitutionProvider) {
      return res.status(403).json({ message: 'Forbidden: Only the provider or admin can view this' });
    }

    const feedback = await ProviderFeedback.find({ scholarshipId: req.params.id }).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getFeedbackSummary = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    const isAdmin = ['admin', 'moderator'].includes(req.user.role);
    const isProvider = scholarship.submittedBy && scholarship.submittedBy.toString() === req.user.id;
    const isInstitutionProvider = req.user.institutionId && scholarship.institutionAllocation && 
                                  scholarship.institutionAllocation.institutionId.toString() === req.user.institutionId;

    if (!isAdmin && !isProvider && !isInstitutionProvider) {
      return res.status(403).json({ message: 'Forbidden: Only the provider or admin can view this' });
    }

    const feedback = await ProviderFeedback.find({ scholarshipId: req.params.id });
    if (feedback.length === 0) {
      return res.json({ total: 0, wasClearPercentage: 0, requirementsAccuratePercentage: 0, confusingStepsList: [] });
    }

    const total = feedback.length;
    const wasClearCount = feedback.filter(f => f.wasClear).length;
    const requirementsAccurateCount = feedback.filter(f => f.requirementsAccurate).length;
    const confusingStepsList = feedback.map(f => f.confusingSteps).filter(Boolean); // Raw entries

    res.json({
      total,
      wasClearPercentage: Math.round((wasClearCount / total) * 100),
      requirementsAccuratePercentage: Math.round((requirementsAccurateCount / total) * 100),
      confusingStepsList
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
