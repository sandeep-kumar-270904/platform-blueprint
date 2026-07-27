const mongoose = require('mongoose');
const User = require('./models/User');
const SkillOffer = require('./models/SkillOffer');
const SkillSession = require('./models/SkillSession');
const SkillGoal = require('./models/SkillGoal');
const SkillEndorsement = require('./models/SkillEndorsement');
const skillStreakService = require('./services/skillStreakService');

require('dotenv').config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const user = await User.findOne();
  if (!user) {
    console.log('No user found');
    process.exit(0);
  }

  console.log(`Testing Phase 9 for user: ${user.name}`);

  // Test Streaks
  const streak = await skillStreakService.calculateStreak(user._id);
  console.log('\n--- Streak Calculation ---');
  console.log('Current Streak:', streak.currentStreak);
  console.log('Longest Streak:', streak.longestStreak);

  // Test Goals
  console.log('\n--- Goal Calculation ---');
  let goals = await SkillGoal.find({ user: user._id });
  if (goals.length === 0) {
    console.log('Creating a test goal...');
    const goal = new SkillGoal({
      user: user._id,
      goalType: 'sessions-per-month',
      target: 2,
      period: 'month'
    });
    await goal.save();
    goals = [goal];
  }
  const processedGoals = await skillStreakService.processGoals(user._id);
  console.log('Processed Goals:', JSON.stringify(processedGoals, null, 2));

  // Test Endorsements
  console.log('\n--- Endorsements ---');
  const endorsements = await SkillEndorsement.find({ endorsee: user._id });
  console.log(`Found ${endorsements.length} endorsements.`);

  console.log('\nPhase 9 test complete.');
  process.exit(0);
}

run().catch(console.error);
