require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Course = require('../models/Course');
const SkillGapLog = require('../models/SkillGapLog');
const skillGapAdvisor = require('../services/skillGapAdvisor');

async function verifySkillGapAdvisor() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studenthub';
  console.log(`Connecting to DB: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  try {
    console.log('🌱 Ensuring curated course catalog is seeded...');
    await skillGapAdvisor.ensureCuratedCatalog();

    const courseCount = await Course.countDocuments();
    console.log(`📚 Total courses in database: ${courseCount}`);
    if (courseCount === 0) {
      throw new Error('Course catalog failed to seed!');
    }

    // Create or find test user
    let user = await User.findOne({ email: 'skillgap_test_user@studenthub.io' });
    if (!user) {
      user = await User.create({
        username: 'skillgap_test_user',
        email: 'skillgap_test_user@studenthub.io',
        password: 'password123',
        full_name: 'Skill Gap Test User',
        role: 'student',
        skills: [{ skillName: 'javascript' }, { skillName: 'html' }]
      });
    } else {
      user.skills = [{ skillName: 'javascript' }, { skillName: 'html' }];
      await user.save();
    }

    // Create or find test team
    let team = await Team.findOne({ title: 'Skill Gap Verification Team' });
    if (!team) {
      team = await Team.create({
        title: 'Skill Gap Verification Team',
        description: 'Building an AI-powered collaborative web app using MERN stack and modern styling.',
        creator: user._id,
        requiredSkills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        requiredRoles: [],
        teamSize: { min: 2, max: 5, current: 1 }
      });
    }

    console.log('⚡ Running getAdviceForUserTeam...');
    const advice = await skillGapAdvisor.getAdviceForUserTeam(user._id.toString(), team._id.toString(), 'low_match_view');

    console.log('\n--- SKILL GAP ADVISOR OUTPUT ---');
    console.log('Match Score:', advice.matchScore + '%');
    console.log('Matched Skills:', advice.matchedSkills);
    console.log('Missing Skills:', advice.missingSkills);
    console.log('Advisor Message:\n', advice.advisorMessage);
    console.log('Resources Breakdown:');
    advice.resources.forEach(r => {
      console.log(`  Skill: [${r.skill}] -> Found ${r.resources.length} resources:`);
      r.resources.forEach(res => {
        console.log(`    - ${res.title} (${res.difficulty}) [${res.source}] -> ${res.url}`);
      });
    });

    if (advice.missingSkills.length === 0) {
      throw new Error('Expected missing skills but got 0!');
    }
    if (advice.resources.length === 0 || advice.resources[0].resources.length === 0) {
      throw new Error('Expected course recommendations but got empty list!');
    }
    if (!advice.advisorMessage || advice.advisorMessage.length < 20) {
      throw new Error('Advisor message missing or too short!');
    }

    console.log('\n⚡ Running getTrendingGaps...');
    const trending = await skillGapAdvisor.getTrendingGaps(user._id.toString());
    console.log('Total Logs:', trending.totalLogs);
    console.log('Trending Skills:', trending.trendingSkills.map(s => `${s.skill} (${s.count} times, ${s.percentage}%)`));

    if (trending.trendingSkills.length === 0) {
      throw new Error('Expected trending skills from logs but got empty list!');
    }

    console.log('\n✅ ALL SKILL GAP ADVISOR BACKEND TESTS PASSED WITH 100% SUCCESS!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message || error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

verifySkillGapAdvisor();
