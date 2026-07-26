const NodeCache = require('node-cache');

// Standard TTL: 5 minutes (300 seconds)
const teamCache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

module.exports = teamCache;
