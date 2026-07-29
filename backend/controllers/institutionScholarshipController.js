const Scholarship = require('../models/Scholarship');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const Notification = require('../models/Notification');

exports.createPooledScholarship = async (req, res) => {
  try {
    const institutionId = req.params.institutionId;
    // Assuming auth middleware attached user and verified institution admin status
    
    const { title, provider, description, amount, eligibility, applicationDeadline, applicationMode, inAppRequirements, totalPoolAmount, intendedAwardCount } = req.body;

    const scholarship = new Scholarship({
      title,
      provider,
      description,
      amount,
      eligibility,
      applicationDeadline,
      applicationMode,
      inAppRequirements,
      source: 'submission',
      submittedBy: req.user.id,
      institutionAllocation: {
        institutionId,
        totalPoolAmount,
        remainingPoolAmount: totalPoolAmount,
        intendedAwardCount
      }
    });

    await scholarship.save();
    res.status(201).json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllocationDashboard = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship || scholarship.institutionAllocation?.institutionId?.toString() !== req.params.institutionId) {
      return res.status(404).json({ message: 'Not found or unauthorized' });
    }

    const applications = await ScholarshipApplication.find({ scholarshipId: req.params.id }).populate('userId', 'name').lean();
    
    const awardedCount = applications.filter(a => a.status === 'awarded').length;

    res.json({
      scholarshipDetails: {
        totalPoolAmount: scholarship.institutionAllocation.totalPoolAmount,
        remainingPoolAmount: scholarship.institutionAllocation.remainingPoolAmount,
        intendedAwardCount: scholarship.institutionAllocation.intendedAwardCount,
        awardedCount
      },
      applications
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.awardApplication = async (req, res) => {
  try {
    const { applicationId, awardAmount } = req.body;
    
    const application = await ScholarshipApplication.findById(applicationId);
    if (!application || application.scholarshipId.toString() !== req.params.id) {
      return res.status(404).json({ message: 'Application not found for this scholarship' });
    }

    if (application.status === 'awarded') {
      return res.status(400).json({ message: 'Already awarded' });
    }

    // Atomic update
    const scholarship = await Scholarship.findOneAndUpdate(
      {
        _id: req.params.id,
        'institutionAllocation.institutionId': req.params.institutionId,
        'institutionAllocation.remainingPoolAmount': { $gte: awardAmount }
      },
      {
        $inc: { 'institutionAllocation.remainingPoolAmount': -awardAmount }
      },
      { new: true }
    );

    if (!scholarship) {
      return res.status(400).json({ message: 'Award exceeds remaining pool amount or unauthorized' });
    }

    // Mark application as awarded
    application.status = 'awarded';
    await application.save();

    // Notify student
    await require("../services/notificationService").sendNotification({
      userId: application.userId,
      type: 'scholarship_awarded',
      relatedContentId: scholarship._id,
      message: `Congratulations! You have been awarded the "${scholarship.title}" scholarship in the amount of $${awardAmount}.`
    });

    // Check savings milestones
    try {
      const { checkSavingsMilestones } = require('./savingsGoalController');
      await checkSavingsMilestones(application.userId);
    } catch (sgErr) {
      console.error('Failed to check savings milestones:', sgErr);
    }

    // Check caps and auto-archive if needed
    const awardedCount = await ScholarshipApplication.countDocuments({ scholarshipId: scholarship._id, status: 'awarded' });
    
    if (scholarship.institutionAllocation.remainingPoolAmount <= 0 || 
       (scholarship.institutionAllocation.intendedAwardCount && awardedCount >= scholarship.institutionAllocation.intendedAwardCount)) {
      
      scholarship.status = 'archived';
      await scholarship.save();

      // Notify institution admin
      await require("../services/notificationService").sendNotification({
        userId: req.user.id,
        type: 'scholarship_pool_exhausted',
        relatedContentId: scholarship._id,
        message: `Your scholarship "${scholarship.title}" has exhausted its funding pool or award cap and has been automatically archived.`
      });
    }

    res.json({ message: 'Awarded successfully', scholarship, application });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
