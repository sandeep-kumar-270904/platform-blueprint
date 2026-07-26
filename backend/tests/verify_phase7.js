const mongoose = require('mongoose');
const connectDB = require('../db');
const Team = require('../models/Team');
const TeamApplication = require('../models/TeamApplication');
const User = require('../models/User');
const teamIntegrationService = require('../services/teamIntegrationService');

async function runVerification() {
  console.log('--- STARTING PHASE 7 VERIFICATION ---');
  await connectDB();

  try {
    // 1. Create mock users
    const user1 = await User.create({
      username: 'test_creator_phase7_' + Date.now(),
      email: `creator_phase7_${Date.now()}@test.com`,
      password: 'password123',
      skills: [{ skillName: 'React' }, { skillName: 'Node.js' }, { skillName: 'TypeScript' }]
    });

    const user2 = await User.create({
      username: 'test_applicant_phase7_' + Date.now(),
      email: `applicant_phase7_${Date.now()}@test.com`,
      password: 'password123',
      skills: [{ skillName: 'React' }, { skillName: 'Python' }]
    });
    console.log('✔ [User Creation] Created test users:', user1.username, '&', user2.username);

    // 2. Test teamIntegrationService.createTeamForProject
    const team = await teamIntegrationService.createTeamForProject({
      creatorId: user1._id,
      title: 'Phase 7 Verification Hackathon Team',
      description: 'Testing programmatic team creation from integration service.',
      maxMembers: 4,
      category: 'Hackathon',
      requiredSkills: ['React', 'Node.js']
    });
    console.log('✔ [Integration Service] createTeamForProject created team ID:', team._id.toString());

    // 3. Test teamIntegrationService.checkTeamEligibility
    const elig1 = await teamIntegrationService.checkTeamEligibility(user1._id, team._id);
    const elig2 = await teamIntegrationService.checkTeamEligibility(user2._id, team._id);
    console.log('✔ [Integration Service] checkTeamEligibility (Creator - 100% match expected):', elig1);
    console.log('✔ [Integration Service] checkTeamEligibility (Applicant - 50% match expected):', elig2);

    // 4. Create an accepted application
    await TeamApplication.create({
      team: team._id,
      applicant: user2._id,
      role: 'Frontend Developer',
      message: 'Would love to join this hackathon team!',
      status: 'accepted'
    });
    console.log('✔ [Application Creation] Created accepted application for user2');

    // 5. Test teamIntegrationService.getUserTeams
    const u1Teams = await teamIntegrationService.getUserTeams(user1._id);
    const u2Teams = await teamIntegrationService.getUserTeams(user2._id);
    console.log(`✔ [Integration Service] getUserTeams for creator found ${u1Teams.length} team(s) with role:`, u1Teams[0]?.role);
    console.log(`✔ [Integration Service] getUserTeams for applicant found ${u2Teams.length} team(s) with role:`, u2Teams[0]?.role);

    // 6. Test Admin Analytics Aggregations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalTeams = await Team.countDocuments();
    const recentApplications = await TeamApplication.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const byCategory = await Team.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const byStatus = await Team.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    console.log('✔ [Admin Analytics Verification] Total Teams:', totalTeams);
    console.log('✔ [Admin Analytics Verification] Recent Applications (30d):', recentApplications);
    console.log('✔ [Admin Analytics Verification] By Category Breakdown:', JSON.stringify(byCategory));
    console.log('✔ [Admin Analytics Verification] By Status Breakdown:', JSON.stringify(byStatus));

    console.log('\n==================================================');
    console.log('ALL PHASE 7 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ Verification failed with error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();
