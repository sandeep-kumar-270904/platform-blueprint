const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsComment = require('./models/NewsComment');
const NewsCollection = require('./models/NewsCollection');

async function testPhase4() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    console.log('Validating NewsComment schema...');
    if (mongoose.modelNames().includes('NewsComment')) {
      console.log('✔ NewsComment model registered');
    } else {
      console.log('❌ NewsComment model missing');
    }

    console.log('Validating NewsCollection schema...');
    if (mongoose.modelNames().includes('NewsCollection')) {
      console.log('✔ NewsCollection model registered');
    } else {
      console.log('❌ NewsCollection model missing');
    }
    
    console.log('Checking User model for digestFrequency...');
    const userSchema = User.schema;
    if (userSchema.paths['newsPreferences.digestFrequency']) {
      console.log('✔ User model has digestFrequency');
    } else {
      console.log('❌ User model missing digestFrequency');
    }

    console.log('Checking NewsArticle model for aiSummary...');
    const articleSchema = NewsArticle.schema;
    if (articleSchema.paths['aiSummary']) {
      console.log('✔ NewsArticle model has aiSummary');
    } else {
      console.log('❌ NewsArticle model missing aiSummary');
    }

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

testPhase4();
