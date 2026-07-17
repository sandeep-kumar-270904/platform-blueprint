const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const newsFetcherService = require('./services/newsFetcherService');
const NewsIngestionLog = require('./models/NewsIngestionLog');
const NewsArticle = require('./models/NewsArticle');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studenthub');
    console.log('Connected to DB');

    // Run fetcher
    await newsFetcherService.fetchNews(null);

    // Verify Log
    const logs = await NewsIngestionLog.find().sort({ runAt: -1 }).limit(1);
    console.log('\n--- Ingestion Logs ---');
    console.log(JSON.stringify(logs, null, 2));

    // Verify Articles
    const articles = await NewsArticle.find().sort({ publishedAt: -1 }).limit(3);
    console.log('\n--- Recent Articles Added ---');
    articles.forEach(a => {
      console.log(`- [${a.category}] ${a.title} (${a.tags.join(', ')})`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

run();
