const ComplianceCheck = require('../models/ComplianceCheck');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const Scholarship = require('../models/Scholarship');
const Notification = require('../models/Notification');

exports.submitProof = async (req, res) => {
  try {
    const complianceCheck = await ComplianceCheck.findById(req.params.id);
    if (!complianceCheck) return res.status(404).json({ message: 'Not found' });

    const application = await ScholarshipApplication.findById(complianceCheck.applicationId);
    if (!application || application.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { text, fileUrl } = req.body;
    complianceCheck.userSubmittedProof = { text, fileUrl };
    complianceCheck.status = 'submitted';

    await complianceCheck.save();
    res.json(complianceCheck);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyProof = async (req, res) => {
  try {
    const complianceCheck = await ComplianceCheck.findById(req.params.id).populate({
      path: 'applicationId',
      populate: { path: 'scholarshipId' }
    });
    if (!complianceCheck) return res.status(404).json({ message: 'Not found' });

    const scholarship = complianceCheck.applicationId.scholarshipId;
    if (scholarship.institutionAllocation?.institutionId && req.user.role !== 'admin') {
      if (!req.user.institutionId || req.user.institutionId.toString() !== scholarship.institutionAllocation.institutionId.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    complianceCheck.status = 'verified';
    complianceCheck.verifiedBy = req.user.id;
    complianceCheck.verifiedAt = new Date();

    await complianceCheck.save();

    await require("../services/notificationService").sendNotification({
      userId: complianceCheck.applicationId.userId,
      type: 'compliance_verified',
      relatedContentId: complianceCheck._id,
      message: `Your compliance proof for "${scholarship.title}" has been verified.`
    });

    res.json(complianceCheck);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.flagAtRisk = async (req, res) => {
  try {
    const complianceCheck = await ComplianceCheck.findById(req.params.id).populate({
      path: 'applicationId',
      populate: { path: 'scholarshipId' }
    });
    if (!complianceCheck) return res.status(404).json({ message: 'Not found' });

    const scholarship = complianceCheck.applicationId.scholarshipId;
    if (scholarship.institutionAllocation?.institutionId && req.user.role !== 'admin') {
      if (!req.user.institutionId || req.user.institutionId.toString() !== scholarship.institutionAllocation.institutionId.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason required' });

    complianceCheck.status = 'at_risk';
    await complianceCheck.save();

    await require("../services/notificationService").sendNotification({
      userId: complianceCheck.applicationId.userId,
      type: 'compliance_at_risk',
      relatedContentId: complianceCheck._id,
      message: `Your scholarship compliance for "${scholarship.title}" is at risk: ${reason}`
    });

    res.json(complianceCheck);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getApplicantChecks = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const checks = await ComplianceCheck.find({ applicationId }).sort({ dueDate: 1 });
    res.json(checks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
