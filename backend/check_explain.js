const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');

async function checkExplain() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  await mongoose.connect(uri);
  
  // Seed some dummy data
  for(let i=0; i<100; i++) {
    await Quiz.create({
      title: `Test ${i}`,
      category: i % 2 === 0 ? 'Computer Science' : 'Math',
      createdBy: new mongoose.Types.ObjectId(),
      mode: 'solo',
      difficulty: 'medium',
      durationMinutes: 10,
      status: 'published'
    });
  }
  
  const quizId = new mongoose.Types.ObjectId();
  const attempts = [];
  for(let i=0; i<100; i++) {
    attempts.push({
      quiz: quizId,
      user: new mongoose.Types.ObjectId(),
      startedAt: new Date(),
      status: 'completed',
      percentageScore: Math.random() * 100,
      totalPossibleScore: 10,
      score: 5
    });
  }
  await QuizAttempt.insertMany(attempts);
  
  console.log("=== EXPLAIN STATS BEFORE ===");
  
  const q1 = await Quiz.find({ 
    status: 'published', 
    category: 'Computer Science',
    difficulty: 'medium',
    mode: 'solo'
  }).sort({ createdAt: -1 }).explain("executionStats");
  
  console.log("Q1 (Quiz Listing) Winning Plan Before:", JSON.stringify(q1.queryPlanner.winningPlan, null, 2));
  
  // Add Indexes
  console.log("Adding Indexes...");
  await Quiz.collection.createIndex({ category: 1, difficulty: 1, mode: 1, status: 1, createdAt: -1 });
  
  console.log("=== EXPLAIN STATS AFTER ===");
  const q3 = await Quiz.find({ 
    status: 'published', 
    category: 'Computer Science',
    difficulty: 'medium',
    mode: 'solo'
  }).sort({ createdAt: -1 }).explain("executionStats");
  
  console.log("Q3 (Quiz Listing) Winning Plan After:", JSON.stringify(q3.queryPlanner.winningPlan, null, 2));
  
  
  await mongoose.disconnect();
  await mongod.stop();
}

checkExplain().catch(console.error);
