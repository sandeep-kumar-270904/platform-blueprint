const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { sendNewsDigest } = require('./services/cronService');
const seedLocalFallback = require('./scripts/seedLocalFallback');
const User = require('./models/User');

async function testDigest() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await seedLocalFallback();
  
  // Set up all users for weekly digest
  await User.updateMany({}, {
    $set: {
      'newsPreferences.digestFrequency': 'weekly',
      'newsPreferences.digestDay': new Date().toLocaleString('en-us', {weekday:'long'}).toLowerCase()
    }
  });

  try {
    console.log("Triggering sendNewsDigest('weekly')...");
    await sendNewsDigest('weekly');
    console.log("sendNewsDigest() completed successfully.");
  } catch(e) {
    console.error("sendNewsDigest() failed:", e);
  }
  process.exit(0);
}

testDigest();
