const mongoose = require('mongoose');
const Quiz = require('./backend/models/Quiz');
const QuizAttempt = require('./backend/models/QuizAttempt');

async function checkExplain() {
  await mongoose.connect('mongodb://127.0.0.1/studenthub_test');
  
  console.log("=== BEFORE INDEXES ===");
  
  // Query 1: Quiz listing with filters
  const q1 = await Quiz.find({ 
    status: 'published', 
    category: 'Computer Science',
    difficulty: 'medium',
    mode: 'solo'
  }).sort({ createdAt: -1 }).explain("executionStats");
  
  console.log("Q1 (Quiz Listing) Execution Time:", q1.executionStats.executionTimeMillis, "ms");
  console.log("Q1 Total Docs Examined:", q1.executionStats.totalDocsExamined);
  console.log("Q1 Winning Plan:", JSON.stringify(q1.queryPlanner.winningPlan, null, 2));
  
  // Query 2: Leaderboard aggregation logic (simulated with find/sort)
  const q2 = await QuizAttempt.find({
    quiz: new mongoose.Types.ObjectId(),
    status: 'completed'
  }).sort({ percentageScore: -1, completedAt: 1 }).explain("executionStats");
  
  console.log("\nQ2 (Leaderboard) Execution Time:", q2.executionStats.executionTimeMillis, "ms");
  console.log("Q2 Total Docs Examined:", q2.executionStats.totalDocsExamined);
  console.log("Q2 Winning Plan:", JSON.stringify(q2.queryPlanner.winningPlan, null, 2));
  
  mongoose.connection.close();
}

checkExplain().catch(console.error);
