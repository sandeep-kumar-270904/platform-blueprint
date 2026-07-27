require('dotenv').config();
const mongoose = require('mongoose');

async function testIndexes() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const SkillOffer = require('./models/SkillOffer.js');
  
  const explain = await SkillOffer.find({ category: 'Technology', status: 'active' })
    .sort({ createdAt: -1 })
    .explain('executionStats');
  
  if (explain.queryPlanner.winningPlan.inputStage) {
      console.log("Index used for Offer query: ", explain.queryPlanner.winningPlan.inputStage.indexName);
  } else {
      console.log("Index used for Offer query: ", explain.queryPlanner.winningPlan.indexName);
  }
  process.exit(0);
}
testIndexes().catch(console.error);
