const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const NewsArticle = require('../backend/models/NewsArticle');
const newsCache = require('../backend/utils/newsCache');

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  
  console.log('✅ Connected to in-memory MongoDB');
  
  // 1. Verify indexes
  await NewsArticle.init(); // ensure indexes are created
  const indexes = await NewsArticle.collection.getIndexes();
  
  let hasTextIndex = false;
  let hasCompoundIndex = false;
  
  for (const [name, index] of Object.entries(indexes)) {
    if (index[0][0] === 'title' && index[0][1] === 'text') {
      hasTextIndex = true;
    }
    if (index[0][0] === 'status' && index[0][1] === 1 && index[1] && index[1][0] === 'publishedAt') {
      hasCompoundIndex = true;
    }
  }
  
  if (hasTextIndex) console.log('✅ Text index verified');
  else console.log('❌ Text index missing', JSON.stringify(indexes, null, 2));
  
  if (hasCompoundIndex) console.log('✅ Compound index verified');
  else console.log('❌ Compound index missing', JSON.stringify(indexes, null, 2));

  // 2. Verify Cache
  newsCache.set('test_key', 'test_value');
  const val = newsCache.get('test_key');
  if (val === 'test_value') console.log('✅ node-cache initialized and working');
  else console.log('❌ node-cache failed');
  
  await mongoose.disconnect();
  await mongoServer.stop();
}

run().catch(console.error);
