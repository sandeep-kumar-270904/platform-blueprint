const mongoose = require('mongoose');
const dotenv = require('dotenv');
const EventRegistration = require('./models/EventRegistration');
const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const Event = require('./models/Event');
const User = require('./models/User');

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/studenthub';

async function migrateTeams() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const registrations = await EventRegistration.find({
      teamName: { $exists: true, $ne: '' },
      teamId: { $exists: false }
    }).populate('userId');

    console.log(`Found ${registrations.length} registrations to migrate.`);

    const grouped = {};
    for (const reg of registrations) {
      if (!reg.teamName || reg.teamName.startsWith('[MIGRATED]')) continue;
      const key = `${reg.eventId.toString()}_${reg.teamName}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(reg);
    }

    let createdTeams = 0;
    for (const key in grouped) {
      const group = grouped[key];
      const eventId = group[0].eventId;
      const teamName = group[0].teamName;
      
      const event = await Event.findById(eventId);
      const teamSize = event?.maxTeamSize || 4;

      // Assign first user as creator
      const creator = group[0].userId;
      
      console.log(`Creating Team: ${teamName} for Event: ${eventId}`);
      
      const newTeam = await Team.create({
        title: teamName,
        description: `Migrated team for event ${event?.title || eventId}`,
        creator: creator._id,
        category: 'Hackathon',
        eventId: eventId,
        teamSize: {
          current: group.length,
          max: teamSize
        },
        status: group.length >= teamSize ? 'completed' : 'open',
        visibility: 'public'
      });

      for (const reg of group) {
        await TeamMember.create({
          teamId: newTeam._id,
          userId: reg.userId._id,
          role: reg.userId._id.toString() === creator._id.toString() ? 'admin' : 'member',
          joinedAt: new Date()
        });

        reg.teamId = newTeam._id;
        reg.teamName = `[MIGRATED] ${reg.teamName}`;
        await reg.save();
      }
      createdTeams++;
    }

    console.log(`Successfully created ${createdTeams} teams and migrated users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateTeams();
