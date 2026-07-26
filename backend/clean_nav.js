const mongoose = require('mongoose');
const SiteNavigation = require('./models/SiteNavigation');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
  await SiteNavigation.deleteMany({});
  console.log('Cleared SiteNavigation');
  process.exit(0);
});
