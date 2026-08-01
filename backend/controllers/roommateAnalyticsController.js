const RoommateProfile = require('../models/RoommateProfile');
const RoommateConnection = require('../models/RoommateConnection');
const User = require('../models/User');

exports.recordProfileView = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.json({ message: 'Own profile' });
    }

    const profile = await RoommateProfile.findOne({ user: targetUserId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.analytics = profile.analytics || { viewCount: 0, viewHistory: [] };
    profile.analytics.viewCount = (profile.analytics.viewCount || 0) + 1;
    profile.analytics.viewHistory.push({ date: new Date() });
    await profile.save();

    res.json({ message: 'View recorded' });
  } catch (err) {
    console.error('Error recording view:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const profile = await RoommateProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Connection Stats
    const allSent = await RoommateConnection.find({ requester: req.user.id });
    const allReceived = await RoommateConnection.find({ recipient: req.user.id });
    
    const sentCount = allSent.length;
    const receivedCount = allReceived.length;
    
    const acceptedSent = allSent.filter(c => c.status === 'Accepted').length;
    const acceptedReceived = allReceived.filter(c => c.status === 'Accepted').length;
    
    const acceptanceRate = sentCount > 0 ? (acceptedSent / sentCount) * 100 : 0;
    
    // Average response time for received requests
    let totalResponseTime = 0;
    let respondedCount = 0;
    
    allReceived.forEach(c => {
      if (c.status !== 'Pending' && c.updated_at && c.created_at) {
        totalResponseTime += (c.updated_at.getTime() - c.created_at.getTime());
        respondedCount++;
      }
    });
    
    const avgResponseTimeMs = respondedCount > 0 ? (totalResponseTime / respondedCount) : null;
    if (avgResponseTimeMs !== null) {
      profile.analytics.averageResponseTimeMs = avgResponseTimeMs;
      await profile.save();
    }

    // Process view history for trends (last 30 days)
    const viewHistory = profile.analytics?.viewHistory || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentViews = viewHistory.filter(v => v.date >= thirtyDaysAgo);
    
    // Group by day
    const viewsByDay = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      viewsByDay[dateStr] = 0;
    }
    
    recentViews.forEach(v => {
      const dateStr = v.date.toISOString().split('T')[0];
      if (viewsByDay[dateStr] !== undefined) {
        viewsByDay[dateStr]++;
      }
    });

    const trendData = Object.keys(viewsByDay).sort().map(date => ({
      date,
      views: viewsByDay[date]
    }));

    // Some dummy correlation insight
    const isVerified = profile.verificationStatus === 'verified';
    const insight = isVerified ? "Verified profiles get up to 2x more views on average!" : "Consider verifying your profile to get up to 2x more views!";

    res.json({
      views: {
        total: profile.analytics?.viewCount || 0,
        trend: trendData
      },
      connections: {
        sent: sentCount,
        received: receivedCount,
        acceptedSent,
        acceptedReceived,
        acceptanceRate: Math.round(acceptanceRate)
      },
      avgResponseTimeMs,
      insight
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
