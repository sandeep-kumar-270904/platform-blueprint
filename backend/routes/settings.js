const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const AuthEvent = require('../models/AuthEvent');

// Middleware to verify session token
const auth = (req, res, next) => {
  const token = req.cookies?.accessToken || (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));
  if (!token) return res.status(401).json({ message: 'No session' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired' });
  }
};

router.post('/request-email-change', auth, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.authProvider === 'local') {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
    }

    const emailChangeToken = crypto.randomBytes(32).toString('hex');
    user.pendingEmail = newEmail;
    user.emailChangeToken = emailChangeToken;
    await user.save();

    await emailService.sendEmailChangeConfirmation(newEmail, user.email, emailChangeToken);

    res.json({ message: 'Confirmation email sent to new address' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/confirm-email-change', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ emailChangeToken: token });
    if (!user || !user.pendingEmail) return res.status(400).json({ message: 'Invalid or expired token' });

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeToken = null;
    await user.save();

    res.json({ message: 'Email successfully updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.authProvider === 'local') {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Convert a social-only user to local if they set a password
    if (user.authProvider !== 'local') {
       user.authProvider = 'local';
    }

    // Revoke all other sessions by rolling the refresh token (they will have to login again)
    // Here we just clear the refreshToken so no auto-refresh works, they must login
    // but we can generate a new one for the current session.
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '30d' }
    );
    user.refreshToken = newRefreshToken;

    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    await AuthEvent.create({ userId: user._id, eventType: 'password_changed', ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress, userAgent: req.headers['user-agent'] });

    res.json({ message: 'Password successfully updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/export-data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // In a real app, this would trigger a background job (e.g. BullMQ) 
    // to gather all data (notes, flashcards, etc.), create a zip/json file, 
    // and email a signed download link.
    // For now, we simulate success.
    
    // Simulate background process
    setTimeout(() => {
      console.log(`[Background Job] Data export ready for ${user.email}`);
    }, 5000);

    res.json({ message: 'Data export initiated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/delete-account', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.email !== email) {
      return res.status(400).json({ message: 'Email does not match' });
    }

    // Soft delete: keep the record but mark as deleted
    user.deletedAt = new Date();
    // Invalidate sessions
    user.refreshToken = null;
    await user.save();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Optionally send farewell email
    console.log(`[Account Deletion] User ${user.email} scheduled for deletion.`);
    
    await AuthEvent.create({ userId: user._id, eventType: 'account_deleted', ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress, userAgent: req.headers['user-agent'] });

    res.json({ message: 'Account scheduled for deletion' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/settings/notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/settings/notifications
router.put('/notifications', auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Deep merge for job_board (existing)
    if (preferences && preferences.job_board) {
      if (!user.notificationPreferences) {
        user.notificationPreferences = { job_board: {} };
      }
      if (!user.notificationPreferences.job_board) {
        user.notificationPreferences.job_board = {};
      }
      user.notificationPreferences.job_board = {
        ...user.notificationPreferences.job_board,
        ...preferences.job_board
      };
    }
    
    // Merge new Phase 3 fields
    const phase3Fields = ['liveSessionReminders', 'liveSessionResults', 'quizModeration', 'leaderboardActivity'];
    for (const field of phase3Fields) {
      if (preferences && preferences[field]) {
        if (!user.notificationPreferences) user.notificationPreferences = {};
        if (!user.notificationPreferences[field]) user.notificationPreferences[field] = {};
        user.notificationPreferences[field] = {
          ...user.notificationPreferences[field],
          ...preferences[field]
        };
      }
    }
    
    await user.save();
    res.json({ message: 'Preferences updated', preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
