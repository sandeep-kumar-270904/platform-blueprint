const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');
const SkillOffer = require('../models/SkillOffer');
const SkillMatch = require('../models/SkillMatch');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const SkillSession = require('../models/SkillSession');
const SkillReview = require('../models/SkillReview');
const { computeMatchesForUser } = require('../services/skillMatchService');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedSkillSwap = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB Connected!');

    // Clear existing
    await SkillOffer.deleteMany({});
    await SkillMatch.deleteMany({});
    await SkillExchangeRequest.deleteMany({});
    await SkillSession.deleteMany({});
    await SkillReview.deleteMany({});
    console.log('Cleared existing Skill Swap data.');

    // Fetch some real users
    const users = await User.find().limit(5);
    if (users.length < 2) {
      console.log('Not enough users to seed. Please seed users first.');
      process.exit(1);
    }

    const mockOffers = [
      {
        user: users[0]._id,
        skillName: 'React & Frontend Dev',
        category: 'Programming',
        description: 'I can teach React, Redux, and modern frontend architecture.',
        proficiencyLevel: 'Expert',
        wantsToLearn: ['Node.js', 'Backend', 'Express'],
        availability: 'Weekends'
      },
      {
        user: users[1]._id,
        skillName: 'Node.js & Backend Architecture',
        category: 'Programming',
        description: 'Happy to help you set up scalable Express servers and MongoDB.',
        proficiencyLevel: 'Advanced',
        wantsToLearn: ['React', 'Figma', 'UI/UX'],
        availability: 'Evenings Mon-Wed'
      },
      {
        user: users[2]._id,
        skillName: 'UI/UX Design in Figma',
        category: 'Design',
        description: 'I will teach you how to build beautiful wireframes and prototypes.',
        proficiencyLevel: 'Intermediate',
        wantsToLearn: ['CSS', 'HTML', 'Frontend'],
        availability: 'Flexible'
      },
      {
        user: users[3]._id,
        skillName: 'Conversational Spanish',
        category: 'Languages',
        description: 'Native Spanish speaker looking to exchange languages.',
        proficiencyLevel: 'Expert',
        wantsToLearn: ['English', 'French'],
        availability: 'Sunday mornings'
      }
    ];

    await SkillOffer.insertMany(mockOffers);
    console.log('Inserted mock Skill Offers.');

    // Compute matches to populate some matches in the log?
    // Actually our GET /api/skill-swap/matches computes matches LIVE.
    // We don't need to persist matches in this script if they are computed live,
    // but we can persist a SkillExchangeRequest just to show incoming requests.
    
    // User 1 requests User 0
    const offer0 = await SkillOffer.findOne({ user: users[0]._id });
    const req1 = new SkillExchangeRequest({
      fromUser: users[1]._id,
      toUser: users[0]._id,
      offer: offer0._id,
      message: 'Hey, I can teach you Node.js in exchange for your React knowledge!'
    });
    await req1.save();

    console.log('Inserted mock Exchange Request.');

    // Create a completed request, session, and review so we have a rating in the UI
    const offer2 = await SkillOffer.findOne({ user: users[2]._id });
    const reqCompleted = new SkillExchangeRequest({
      fromUser: users[1]._id,
      toUser: users[2]._id,
      offer: offer2._id,
      message: 'I want to learn Figma!',
      status: 'completed',
      scheduledAt: new Date(Date.now() - 86400000), // yesterday
      completedAt: new Date()
    });
    await reqCompleted.save();

    const mockSession = new SkillSession({
      request: reqCompleted._id,
      participants: [users[1]._id, users[2]._id],
      scheduledAt: reqCompleted.scheduledAt,
      status: 'completed'
    });
    await mockSession.save();

    const mockReview = new SkillReview({
      session: mockSession._id,
      reviewer: users[1]._id,
      reviewee: users[2]._id,
      rating: 5,
      comment: 'Amazing Figma session! Learned so much about components.'
    });
    await mockReview.save();

    console.log('Inserted mock Session and Review.');
    console.log('Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedSkillSwap();
