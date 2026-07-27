require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const SkillCircle = require('../models/SkillCircle');
const SkillCircleSession = require('../models/SkillCircleSession');
const SkillCircleMessage = require('../models/SkillCircleMessage');

const seedCircles = async () => {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const users = await User.find().limit(5);
    if (users.length < 2) {
      console.log('Not enough users to seed circles');
      process.exit(1);
    }

    const [user1, user2, user3] = users;

    await SkillCircle.deleteMany({});
    await SkillCircleSession.deleteMany({});
    await SkillCircleMessage.deleteMany({});

    console.log('Cleared existing circles');

    const circle1 = new SkillCircle({
      creator: user1._id,
      skillName: 'Advanced React Patterns',
      category: 'Programming',
      description: 'Weekly deep dive into React hooks, context, and performance optimization.',
      maxMembers: 10,
      members: [user1._id, user2._id],
      recurrence: 'weekly',
      scheduleInfo: { dayOfWeek: 'Wednesday', time: '18:00' }
    });

    const circle2 = new SkillCircle({
      creator: user2._id,
      skillName: 'Conversational Spanish',
      category: 'Languages',
      description: 'Practice speaking Spanish in a casual group setting.',
      maxMembers: 5,
      members: [user2._id, user3._id],
      recurrence: 'biweekly',
      scheduleInfo: { dayOfWeek: 'Saturday', time: '10:00' }
    });

    await circle1.save();
    await circle2.save();

    console.log('Created circles.');

    // Create a scheduled session
    const session1 = new SkillCircleSession({
      circle: circle1._id,
      scheduledAt: new Date(Date.now() + 86400000 * 3), // 3 days from now
      status: 'scheduled',
      attendees: []
    });

    await session1.save();

    // Create some messages
    const msg1 = new SkillCircleMessage({
      circle: circle1._id,
      sender: user1._id,
      content: 'Welcome to the React group everyone!'
    });

    const msg2 = new SkillCircleMessage({
      circle: circle1._id,
      sender: user2._id,
      content: 'Thanks for organizing, excited to learn!'
    });

    await msg1.save();
    await msg2.save();

    console.log('Seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding circles:', error);
    process.exit(1);
  }
};

seedCircles();
