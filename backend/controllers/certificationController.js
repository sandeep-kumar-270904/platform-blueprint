const CertificationRecord = require('../models/CertificationRecord');
const Notification = require('../models/Notification');
const AdminActionLog = require('../models/AdminActionLog');

exports.getMyCertifications = async (req, res) => {
  try {
    const certs = await CertificationRecord.find({ userId: req.user.id });
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addCertification = async (req, res) => {
  try {
    const { name, issuer, issueDate, expiryDate, credentialId, evidenceUrl, linkedResumeIds, platformCourseId } = req.body;
    
    let verificationStatus = 'unverified';
    if (platformCourseId) {
      // In a real flow, verify against CourseEnrollment or QuizAttempt
      // For now, we trust the frontend's claim it came from the platform if platformCourseId is provided
      verificationStatus = 'platform_verified';
    }

    const cert = new CertificationRecord({
      userId: req.user.id,
      name, issuer, issueDate, expiryDate, credentialId, evidenceUrl, linkedResumeIds,
      verificationStatus
    });
    
    await cert.save();
    res.status(201).json(cert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCertification = async (req, res) => {
  try {
    const cert = await CertificationRecord.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!cert) return res.status(404).json({ message: 'Not found' });
    res.json(cert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCertification = async (req, res) => {
  try {
    const cert = await CertificationRecord.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!cert) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin route
exports.verifyCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // 'platform_verified' or 'unverified'
    const cert = await CertificationRecord.findById(id);
    if (!cert) return res.status(404).json({ message: 'Not found' });
    
    cert.verificationStatus = status;
    if (rejectionReason) cert.rejectionReason = rejectionReason;
    
    await cert.save();
    
    await AdminActionLog.create({
      adminId: req.user.id,
      actionType: status === 'platform_verified' ? 'approve_certification' : 'reject_certification',
      targetId: cert._id,
      reason: rejectionReason || 'Admin reviewed certification'
    });
    
    if (status === 'platform_verified') {
      await require("../services/notificationService").sendNotification({
        user_id: cert.userId,
        title: 'Certification Verified',
        message: `Your certification "${cert.name}" has been verified by an admin.`,
        type: 'cert_verified'
      });
    }

    res.json(cert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending for admin
exports.getPendingVerifications = async (req, res) => {
  try {
    const certs = await CertificationRecord.find({ verificationStatus: 'unverified', evidenceUrl: { $ne: null } })
      .populate('userId', 'name email');
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
