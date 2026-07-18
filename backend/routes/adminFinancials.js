const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const MentorBooking = require('../models/MentorBooking');
const Dispute = require('../models/Dispute');
const PayoutTracking = require('../models/PayoutTracking');
const AdminActionLog = require('../models/AdminActionLog');
const notificationService = require('../services/notificationService');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const isSuperAdmin = async (req, res, next) => {
  if (req.adminUser.adminRole !== 'super') {
    return res.status(403).json({ message: 'Access denied. Super Admin required for financial operations.' });
  }
  next();
};

// GET /api/admin/financials/overview
router.get('/overview', authMiddleware, isAdmin, async (req, res) => {
  try {
    const bookings = await MentorBooking.find().populate('mentorId', 'full_name').populate('menteeId', 'full_name').lean();
    const disputes = await Dispute.find().populate('openedBy', 'full_name email').populate('targetId').lean();
    const payouts = await PayoutTracking.find().populate('mentorId', 'full_name email').lean();

    res.json({ bookings, disputes, payouts });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching financials', error: err.message });
  }
});

// POST /api/admin/financials/disputes/:id/resolve
router.post('/disputes/:id/resolve', authMiddleware, isAdmin, isSuperAdmin, async (req, res) => {
  const { resolution, issueRefund, banUser, reason } = req.body;
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = req.adminUser._id;
    await dispute.save();

    await AdminActionLog.create({
      adminId: req.adminUser._id,
      actionType: 'resolve_dispute',
      targetId: dispute._id,
      reason: resolution
    });

    // Notify parties
    const TargetModel = require('../models/MentorBooking');
    const booking = await TargetModel.findById(dispute.targetId);
    
    if (booking) {
      await notificationService.createNotification({
        userId: booking.menteeId,
        type: 'dispute_resolved',
        message: `Your dispute for a mentor booking was resolved. Resolution: ${resolution}`
      });
      await notificationService.createNotification({
        userId: booking.mentorId,
        type: 'dispute_resolved',
        message: `A dispute regarding your session was resolved. Resolution: ${resolution}`
      });

      if (issueRefund) {
        // Trigger hypothetical refund API
        // stripe.refunds.create({ payment_intent: booking.paymentIntentId });
        booking.paymentStatus = 'refunded';
        await booking.save();
        await AdminActionLog.create({
          adminId: req.adminUser._id,
          actionType: 'issue_refund',
          targetId: booking._id,
          reason: 'Dispute resolution refund'
        });
      }
    }

    if (banUser && dispute.openedBy) {
      // e.g. Banning the offender if malicious
      await User.findByIdAndUpdate(dispute.openedBy, {
        banned: true,
        banReason: reason || 'Banned during dispute resolution',
        bannedAt: new Date()
      });
    }

    res.json({ message: 'Dispute resolved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error processing dispute', error: err.message });
  }
});

module.exports = router;
