const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const CompanyPrep = require('../models/CompanyPrep');
const AptitudeTestDefinition = require('../models/AptitudeTestDefinition');
const AptitudeTestAttempt = require('../models/AptitudeTestAttempt');
const UserQuestionAttempt = require('../models/UserQuestionAttempt');
const User = require('../models/User');

dotenv.config({ path: 'backend/.env' });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Seed Aptitude Questions
    await AptitudeQuestion.deleteMany({});
    
    const questions = [
      {
        category: 'Quantitative',
        topic: 'Percentages',
        difficulty: 'Easy',
        question: 'If 20% of a number is 50, what is the number?',
        options: ['250', '200', '150', '300'],
        correctAnswer: 0,
        explanation: 'Let the number be x. 20% of x = 50 => (20/100) * x = 50 => x = (50 * 100) / 20 = 250.'
      },
      {
        category: 'Quantitative',
        topic: 'Time and Work',
        difficulty: 'Medium',
        question: 'A can do a piece of work in 10 days and B can do it in 15 days. How long will they take if they work together?',
        options: ['6 days', '5 days', '8 days', '12 days'],
        correctAnswer: 0,
        explanation: 'A\'s 1 day work = 1/10. B\'s 1 day work = 1/15. Together = 1/10 + 1/15 = 5/30 = 1/6. So they take 6 days.'
      },
      {
        category: 'Logical',
        topic: 'Blood Relations',
        difficulty: 'Medium',
        question: 'Pointing to a photograph, a man said, "I have no brother or sister but that man\'s father is my father\'s son." Whose photograph was it?',
        options: ['His own', 'His son\'s', 'His father\'s', 'His nephew\'s'],
        correctAnswer: 1,
        explanation: 'Since he has no brother or sister, "my father\'s son" is the man himself. So, the man\'s father is the speaker himself. Thus, it is his son\'s photograph.'
      },
      {
        category: 'Verbal',
        topic: 'Sentence Correction',
        difficulty: 'Easy',
        question: 'Identify the grammatically correct sentence:',
        options: [
          'He don\'t know the answer.',
          'He doesn\'t knows the answer.',
          'He doesn\'t know the answer.',
          'He do not knows the answer.'
        ],
        correctAnswer: 2,
        explanation: '"doesn\'t" is the correct auxiliary for "he", and it should be followed by the base form of the verb "know".'
      }
    ];

    await AptitudeQuestion.insertMany(questions);
    console.log('Aptitude Questions seeded successfully');

    // 2. Update a company with an Aptitude Pattern
    const tcs = await CompanyPrep.findOne({ name: 'TCS' });
    let companyId = null;
    if (tcs) {
      tcs.aptitudePattern = {
        hasAptitude: true,
        quantQuestions: 20,
        logicalQuestions: 15,
        verbalQuestions: 15,
        durationMinutes: 60,
        notes: 'TCS NQT generally emphasizes moderate-level quantitative and reasoning questions.'
      };
      await tcs.save();
      companyId = tcs._id;
      console.log('TCS aptitude pattern updated');
    }

    // 3. Create Aptitude Test Definition
    await AptitudeTestDefinition.deleteMany({});
    const def = new AptitudeTestDefinition({
      name: 'Generic Campus Mock',
      description: 'Standard 45-minute strict mock test',
      timeLimitMinutes: 45,
      allowBackwardNavigation: false,
      rules: [
        { category: 'Quantitative', count: 1 },
        { category: 'Logical', count: 1 },
        { category: 'Verbal', count: 1 }
      ] // Just 3 for testing
    });
    await def.save();
    console.log('Test Definition created');

    // 4. Create dummy attempts for percentile testing
    await AptitudeTestAttempt.deleteMany({});
    const user = await User.findOne();
    if (user) {
      for (let i = 0; i < 6; i++) {
        await AptitudeTestAttempt.create({
          user: user._id,
          testDefinition: def._id,
          status: 'Completed',
          startTime: new Date(),
          endTime: new Date(),
          expiresAt: new Date(),
          overallScore: i * 2, // 0, 2, 4, 6, 8, 10
          maxScore: 10
        });
      }
      console.log('Dummy completed attempts seeded for percentile calculations');
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error with seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
