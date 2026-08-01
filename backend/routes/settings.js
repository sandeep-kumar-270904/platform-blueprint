const express = require('express');
const router = express.Router();
const User = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const CommunityLike = require('../models/CommunityLike');
const RepairRequest = require('../models/RepairRequest');
const RepairProvider = require('../models/RepairProvider');
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

router.post('/request-data-export', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const posts = await CommunityPost.find({ user_id: req.user.id });
    const comments = await CommunityComment.find({ user_id: req.user.id });
    const likes = await CommunityLike.find({ user_id: req.user.id });
    
    // Repair & Maintenance Data
    const repairRequests = await RepairRequest.find({ userId: req.user.id }).lean();
    const userDoc = await User.findById(req.user.id).lean();
    const savedProviderIds = userDoc.savedRepairProviders || [];
    const savedProviders = await RepairProvider.find({ _id: { $in: savedProviderIds } }, 'name category').lean();

    const exportData = {
      profile: {
        username: user.username,
        email: user.email,
        joinedAt: user.createdAt
      },
      communityActivity: {
        posts,
        comments,
        likes
      },
      repairAndMaintenance: {
        repairRequests,
        savedProviders
      }
    };
    
    res.setHeader('Content-disposition', 'attachment; filename=my-activity.json');
    res.setHeader('Content-type', 'application/json');
    return res.status(200).send(JSON.stringify(exportData, null, 2));
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

    // Soft delete & anonymize: keep the record but strip PII so posts remain as "Deleted User"
    user.deletedAt = new Date();
    user.username = `DeletedUser_${user._id}`;
    user.full_name = "Deleted User";
    user.avatar_url = null;
    user.email = `${user._id}@deleted.local`;
    
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
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let pref = await NotificationPreference.findOne({ user_id: req.user.id }).lean();
    if (!pref) {
      pref = {
        toggles: {
          community_like: true, community_comment: true, community_mention: true, community_follow: true, community_post: true, weekly_digest: true
        },
        quiet_hours: { enabled: false, start_time: '22:00', end_time: '08:00' }
      };
    }
    
    res.json({ 
      preferences: {
        ...user.notificationPreferences,
        toggles: pref.toggles,
        quiet_hours: pref.quiet_hours
      } 
    });
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
    
    // Merge other module fields dynamically
    const additionalFields = [
      'liveSessionReminders', 'liveSessionResults', 'quizModeration', 'leaderboardActivity',
      'mentorUpdates', 'subscriptions', 'communityForums', 'cohorts', 'learningPaths',
      'scholarships', 'roommateConnections', 'community'
    ];
    for (const field of additionalFields) {
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

    // Update NotificationPreference
    if (preferences.toggles || preferences.quiet_hours) {
      let pref = await NotificationPreference.findOne({ user_id: req.user.id });
      if (!pref) {
        pref = new NotificationPreference({ user_id: req.user.id });
      }
      if (preferences.toggles) {
        pref.toggles = { ...pref.toggles, ...preferences.toggles };
      }
      if (preferences.quiet_hours) {
        pref.quiet_hours = { ...pref.quiet_hours, ...preferences.quiet_hours };
      }
      await pref.save();
    }

    res.json({ message: 'Preferences updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
