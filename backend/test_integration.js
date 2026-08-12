const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/studenthub';

async function runTests() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const EventRegistration = require('./models/EventRegistration');
  const Team = require('./models/Team');
  const TeamMember = require('./models/TeamMember');
  const TeamApplication = require('./models/TeamApplication');
  const TeamInvite = require('./models/TeamInvite');
  
  const regWithTeamNameCount = await EventRegistration.countDocuments({ teamName: { $exists: true, $ne: '' } });
  const regWithTeamNameDocs = await EventRegistration.find({ teamName: { $exists: true, $ne: '' } });
  console.log('Unmigrated docs:', regWithTeamNameDocs);
  const regWithTeamId = await EventRegistration.countDocuments({ teamId: { $exists: true } });
  const teamsWithEventId = await Team.countDocuments({ eventId: { $exists: true } });
  const teamMembers = await TeamMember.countDocuments();
  const teamApplications = await TeamApplication.countDocuments();
  const teamInvites = await TeamInvite.countDocuments();

  console.log(`EventRegistration with teamName: ${regWithTeamName}`);
  console.log(`EventRegistration with teamId: ${regWithTeamId}`);
  console.log(`Team with eventId: ${teamsWithEventId}`);
  console.log(`TeamMember records: ${teamMembers}`);
  console.log(`TeamApplication records: ${teamApplications}`);
  console.log(`TeamInvite records: ${teamInvites}`);

  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
