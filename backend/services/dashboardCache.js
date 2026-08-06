const NodeCache = require('node-cache');
const dashboardCache = new NodeCache({ stdTTL: 30, checkperiod: 45 });

const notifyDashboardUpdate = (req, userId) => {
  dashboardCache.del(`dashboard_summary_${userId}`);
  if (req.io) {
    req.io.to(userId.toString()).emit('dashboard-stats-updated');
  }
};

module.exports = {
  dashboardCache,
  notifyDashboardUpdate
};
