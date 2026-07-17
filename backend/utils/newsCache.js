const NodeCache = require('node-cache');
const newsCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

module.exports = newsCache;
