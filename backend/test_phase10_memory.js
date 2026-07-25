const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsAuditLog = require('./models/NewsAuditLog');

async function runPhase10Audit() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  let results = {};

  try {
    const user = new User({ email: 'qa10@test.com', password: '123' });
    await user.save();

    console.log('--- Checking Phase 10 Schema Additions ---');

    // 1. Author Tracking & Reading Time
    const article = new NewsArticle({ 
      title: 'Phase 10', 
      summary: 'Testing final fixes', 
      sourceLink: 'https://test10.com', 
      sourceName: 'QA', 
      category: 'AI',
      author: 'Jane Doe',
      readingTime: 5
    });
    await article.save();
    
    if (article.author === 'Jane Doe') results['author-tracking'] = 'PASS';
    else results['author-tracking'] = 'FAIL';
    
    if (article.readingTime === 5) results['reading-time'] = 'PASS';
    else results['reading-time'] = 'FAIL';

    // 2. Onboarding Prompt
    if (user.hasCompletedNewsOnboarding === false) {
      user.hasCompletedNewsOnboarding = true;
      await user.save();
      results['onboarding-prompt'] = 'PASS';
    } else {
      results['onboarding-prompt'] = 'FAIL';
    }

    // 3. Admin Audit Logging
    const log = new NewsAuditLog({
      adminId: user._id,
      action: 'approve',
      targetArticleId: article._id
    });
    await log.save();
    
    if (log.action === 'approve') results['admin-audit-logging'] = 'PASS';
    else results['admin-audit-logging'] = 'FAIL';

    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Audit crashed:', err);
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runPhase10Audit();
