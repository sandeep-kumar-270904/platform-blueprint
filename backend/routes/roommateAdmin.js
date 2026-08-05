const express = require('express');
const router = express.Router();
const RoommateVerificationRequest = require('../models/RoommateVerificationRequest');
const RoommateProfile = require('../models/RoommateProfile');
const auth = require('../middleware/auth');
// In a real app we'd have a checkAdmin middleware
// const { checkAdmin } = require('../middleware/checkAdmin');

// Route: /api/admin/roommates

// Get pending ID verification requests
router.get('/verification-requests', auth, async (req, res) => {
  try {
    const requests = await RoommateVerificationRequest.find({ status: 'pending' }).populate('user', 'name full_name email');
    res.json(requests);
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve ID request
router.post('/verification-requests/:id/approve', auth, async (req, res) => {
  try {
    const request = await RoommateVerificationRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    request.status = 'approved';
    await request.save();

    const profile = await RoommateProfile.findOne({ user: request.user });
    if (profile) {
      profile.verificationStatus = 'id_verified';
      await profile.save();
    }

    res.json({ message: 'Request approved successfully', request });
  } catch (error) {
    console.error('Error approving verification request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject ID request
router.post('/verification-requests/:id/reject', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await RoommateVerificationRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    request.status = 'rejected';
    request.rejectionReason = reason || 'ID unclear or invalid';
    await request.save();

    res.json({ message: 'Request rejected successfully', request });
  } catch (error) {
    console.error('Error rejecting verification request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
