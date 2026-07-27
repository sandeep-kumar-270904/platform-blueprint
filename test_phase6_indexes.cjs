const mongoose = require('mongoose');

async function testIndexes() {
  await mongoose.connect('mongodb+srv://admin:admin123@cluster0.pld80.mongodb.net/test?retryWrites=true&w=majority');
  console.log("Connected to MongoDB");

  const SkillOffer = require('./backend/models/SkillOffer.js');
  
  const explain = await SkillOffer.find({ category: 'Technology', status: 'active' })
    .sort({ createdAt: -1 })
    .explain('executionStats');
  
  console.log("Index used for Offer query: ", explain.queryPlanner.winningPlan.inputStage.indexName);
  
  process.exit(0);
}
testIndexes().catch(console.error);
