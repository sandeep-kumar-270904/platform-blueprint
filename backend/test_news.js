const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const NewsArticle = require('../backend/models/NewsArticle');
const User = require('../backend/models/User');
const NewsSourceHealth = require('../backend/models/NewsSourceHealth');
const NEWS_SOURCES = require('../backend/config/newsSources');
const newsFetcherService = require('../backend/services/newsFetcherService');

dotenv.config({ path: path.join(__dirname, '.env') });
const API_URL = 'http://localhost:8080';

async function runVerification() {
  console.log("Starting End-to-End Verification...");
  const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/platform-blueprint';
  await mongoose.connect(dbUri);
  console.log("Connected to MongoDB.");

  const results = {};

  // Create a test user
  let testUser = await User.findOne({ username: 'news_qa_user' });
  if (!testUser) {
    testUser = new User({
      username: 'news_qa_user',
      email: 'news_qa@example.com',
      password: 'password123',
      role: 'user',
      newsPreferences: {
        followedCategories: ['AI'],
        followedTags: [],
        preferredSources: ['TechCrunch'],
        mutedSources: ['Engadget'],
        mutedTags: []
      }
    });
    await testUser.save();
  }
  const token = jwt.sign({ userId: testUser._id, role: testUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  
  let adminUser = await User.findOne({ username: 'news_admin_user' });
  if (!adminUser) {
    adminUser = new User({
      username: 'news_admin_user',
      email: 'news_admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();
  }
  const adminToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  const axiosClient = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` }});
  const adminClient = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${adminToken}` }});

  // 1. Cross-Phase Checks
  console.log("\\n--- 1. CROSS-PHASE INTEGRATION CHECKS ---");
  try {
    const badArticle = new NewsArticle({
      title: 'Bad URL Test',
      sourceLink: 'javascript:alert(1)',
      summary: 'Testing bad URL',
      category: 'AI',
      status: 'live'
    });
    await badArticle.save();
    results['Cross-Phase: Schema URL Validation (Phase 1+2)'] = 'FAIL (Saved invalid URL)';
    await NewsArticle.deleteOne({ _id: badArticle._id });
  } catch (err) {
    if (err.name === 'ValidationError') {
      results['Cross-Phase: Schema URL Validation (Phase 1+2)'] = 'PASS';
    } else {
      results['Cross-Phase: Schema URL Validation (Phase 1+2)'] = `FAIL (${err.message})`;
    }
  }

  // 2. Ingestion Pipeline
  console.log("\\n--- 2. INGESTION PIPELINE END-TO-END ---");
  const originalUrl = NEWS_SOURCES[0].url;
  NEWS_SOURCES[0].url = 'http://localhost:9999/brokenfeed.xml'; // broken link
  
  try {
    await newsFetcherService.fetchNews();
    const health = await NewsSourceHealth.findOne({ sourceName: NEWS_SOURCES[0].name });
    if (health && health.lastStatus === 'error') {
      results['Ingestion: Broken feed handled properly'] = 'PASS';
    } else {
      results['Ingestion: Broken feed handled properly'] = 'FAIL (Status not error)';
    }
    
    const otherHealth = await NewsSourceHealth.findOne({ sourceName: NEWS_SOURCES[1].name });
    if (otherHealth && otherHealth.lastStatus === 'success') {
      results['Ingestion: Other feeds continued'] = 'PASS';
    } else {
       results['Ingestion: Other feeds continued'] = 'FAIL (Other feed did not succeed)';
    }
  } catch (err) {
    results['Ingestion: Pipeline'] = `FAIL (${err.message})`;
  } finally {
    NEWS_SOURCES[0].url = originalUrl;
  }

  // 3. Rate Limiting and Dedup
  console.log("\\n--- 3. VIEW-COUNT & RATE LIMITING ---");
  const liveArticle = await NewsArticle.findOne({ status: 'live' });
  if (liveArticle) {
    const initialViews = liveArticle.viewCount || 0;
    
    try {
      await axiosClient.post(`/api/news/${liveArticle._id}/view`);
      await axiosClient.post(`/api/news/${liveArticle._id}/view`);
      
      const updatedArticle = await NewsArticle.findById(liveArticle._id);
      if (updatedArticle.viewCount === initialViews + 1) {
        results['View-Count: Deduplication (Phase 1)'] = 'PASS';
      } else {
        results['View-Count: Deduplication (Phase 1)'] = `FAIL (Expected ${initialViews + 1}, got ${updatedArticle.viewCount})`;
      }
    } catch(err) {
      results['View-Count: Deduplication (Phase 1)'] = `FAIL API ERR: ${err.message}`;
    }
  } else {
    results['View-Count: Deduplication (Phase 1)'] = 'SKIP (No live articles)';
  }

  let rateLimitHit = false;
  for(let i=0; i<15; i++) {
    try {
      await axiosClient.post(`/api/news`, {
        title: 'Rate Limit Test ' + i,
        sourceLink: `https://example.com/ratelimit${i}`,
        summary: 'Testing rate limit',
        category: 'AI'
      });
    } catch (err) {
      if (err.response && err.response.status === 429) {
        rateLimitHit = true;
        break;
      }
    }
  }
  results['Rate Limiting: POST /api/news (Phase 1)'] = rateLimitHit ? 'PASS' : 'FAIL (Did not hit 429 after 15 requests)';

  // 4. For You Personalization
  console.log("\\n--- 4. FOR YOU PERSONALIZATION ---");
  try {
    const forYouRes = await axiosClient.get('/api/news?forYou=true');
    if (forYouRes.status === 200) {
      const articles = forYouRes.data.articles || forYouRes.data;
      if (Array.isArray(articles)) {
        const hasMuted = articles.some(a => a.sourceName === 'Engadget');
        if (hasMuted) {
          results['For You: Muted Sources (Phase 3)'] = 'FAIL (Returned muted source)';
        } else {
          results['For You: Muted Sources (Phase 3)'] = 'PASS';
        }
      } else {
         results['For You: Muted Sources (Phase 3)'] = 'FAIL (Did not return array)';
      }
    }
  } catch (err) {
    results['For You: Personalization (Phase 3)'] = `FAIL (${err.message})`;
  }

  // 5. Security Re-check
  console.log("\\n--- 5. SECURITY RE-CHECK ---");
  try {
    await axiosClient.post('/api/news', {
      title: 'XSS Test',
      sourceLink: 'javascript:alert(1)',
      summary: 'Testing XSS',
      category: 'AI'
    });
    results['Security: Reject javascript: (Phase 1)'] = 'FAIL (API accepted it)';
  } catch (err) {
    if (err.response && (err.response.status === 400 || err.response.status === 500)) {
      results['Security: Reject javascript: (Phase 1)'] = 'PASS';
    } else {
      results['Security: Reject javascript: (Phase 1)'] = `FAIL (Status ${err.response?.status})`;
    }
  }

  if (liveArticle) {
     try {
       await adminClient.put(`/api/news/${liveArticle._id}/status`, { status: 'under_review' });
       const log = await mongoose.model('AdminActionLog').findOne({ targetId: liveArticle._id, actionType: 'UPDATE_NEWS_STATUS' });
       if (log) {
         results['Security: Admin Audit Log (Phase 1)'] = 'PASS';
       } else {
         results['Security: Admin Audit Log (Phase 1)'] = 'FAIL (Log not found)';
       }
     } catch(err) {
       results['Security: Admin Audit Log (Phase 1)'] = `FAIL (API error: ${err.message})`;
     }
  }

  console.log("\\n--- RESULTS ---");
  for (const [test, res] of Object.entries(results)) {
    console.log(`${test}: ${res}`);
  }

  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error("Verification failed to run fully:", err);
  process.exit(1);
});
