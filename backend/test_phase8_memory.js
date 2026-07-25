const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsCollection = require('./models/NewsCollection');

async function verifyPhase8Data() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  try {
    console.log('Connecting to Mock MongoDB Server for Phase 8...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // Wait for text indexes to build
    await NewsArticle.init();
    
    let user1 = new User({ email: 'user1@test.com', password: '123' });
    let user2 = new User({ email: 'user2@test.com', password: '123' });
    await user1.save();
    await user2.save();
    
    console.log('\n--- 1. Testing NewsArticle (Versioning & Translations) ---');
    
    // Simulate translation Map
    const translations = new Map();
    translations.set('te', '[te] This is a telugu translation summary');
    
    let article = new NewsArticle({
      title: 'Phase 8 Feature Test',
      sourceLink: 'https://example.com/phase8',
      sourceName: 'TechDaily',
      category: 'AI',
      summary: 'Initial Summary',
      aiSummary: 'English AI Summary',
      aiSummaryTranslations: translations,
      versions: [
        { updatedAt: new Date(), changes: 'Headline updated' }
      ],
      sourceCredibility: 'Tech industry publication'
    });
    
    await article.save();
    console.log('✔ NewsArticle saved successfully.');
    console.log('Credibility:', article.sourceCredibility);
    console.log('Versions Count:', article.versions.length);
    console.log('Translation [te]:', article.aiSummaryTranslations.get('te'));

    console.log('\n--- 2. Testing NewsCollection (Collaborators) ---');
    let collection = new NewsCollection({
      userId: user1._id,
      name: 'Group Study',
      collaborators: [user2._id]
    });
    await collection.save();
    console.log('✔ NewsCollection saved successfully with collaborators.');
    console.log(`Collaborator count: ${collection.collaborators.length}`);

    console.log('\n✅ VERIFICATION COMPLETE: Phase 8 models and relations successfully validated.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Disconnected.');
  }
}

verifyPhase8Data();
