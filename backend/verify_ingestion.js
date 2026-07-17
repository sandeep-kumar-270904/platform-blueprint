require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const newsFetcherService = require('./services/newsFetcherService');
const NewsIngestionLog = require('./models/NewsIngestionLog');
const NewsArticle = require('./models/NewsArticle');
const db = require('./db');

async function verifyIngestion() {
  try {
    await db();
    console.log('--- Starting Verification of News Ingestion Engine ---');
    
    // Clean up before test to see raw results
    await NewsArticle.deleteMany({ submissionType: 'automatic' });
    await NewsIngestionLog.deleteMany({});
    
    // Trigger the service manually
    await newsFetcherService.fetchNews(null); // io = null

    // Check results
    const logs = await NewsIngestionLog.find().sort({ runAt: -1 }).limit(1);
    const articles = await NewsArticle.find({ submissionType: 'automatic' });

    console.log('\n--- VERIFICATION RESULTS ---');
    if (logs.length > 0) {
      const log = logs[0];
      console.log(`[PASS] Ingestion Log created.`);
      console.log(`Metrics: Fetched=${log.metrics.totalFetched}, Added=${log.metrics.totalAdded}, Skipped=${log.metrics.duplicatesSkipped}, Rejected=${log.metrics.spamRejected}`);
      if (log.errorLogs && log.errorLogs.length > 0) {
        console.warn(`[WARN] Errors occurred during ingestion:`);
        log.errorLogs.forEach(e => console.log(`  - ${e}`));
      }
    } else {
      console.log(`[FAIL] No Ingestion Log created.`);
    }

    if (articles.length > 0) {
      console.log(`[PASS] ${articles.length} articles inserted.`);
      const sample = articles[0];
      console.log(`\nSample Article:`);
      console.log(`  Title: ${sample.title}`);
      console.log(`  Category: ${sample.category}`);
      console.log(`  Tags: ${sample.tags.join(', ')}`);
      console.log(`  Image: ${sample.imageUrl}`);
      console.log(`  Status: ${sample.status}`);
      
      if (!sample.imageUrl) {
         console.log(`[FAIL] Missing image URL on sample.`);
      }
      if (sample.tags.length === 0) {
         console.log(`[WARN] No tags extracted for sample. (Could just be content-dependent)`);
      }
    } else {
      console.log(`[FAIL] No articles were inserted. Check feed connectivity or spam logic.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyIngestion();
