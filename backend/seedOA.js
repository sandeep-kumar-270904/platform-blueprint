const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OADefinition = require('./models/OADefinition');
const CompanyPrep = require('./models/CompanyPrep');
const DSAProblem = require('./models/DSAProblem');
const AptitudeQuestion = require('./models/AptitudeQuestion');
const connectDB = require('./db');

dotenv.config({ path: '.env' });

async function seed() {
  await connectDB();
  
  const amazon = await CompanyPrep.findOne({ name: 'Amazon' });
  if (!amazon) {
    console.log("Amazon not found");
    process.exit(1);
  }

  // Get a couple of DSA problems
  const problems = await DSAProblem.find().limit(2);
  
  // Seed a dummy aptitude question just in case there are none
  let apt = await AptitudeQuestion.findOne();
  if (!apt) {
    apt = new AptitudeQuestion({
      category: 'Quantitative',
      topic: 'Percentages',
      difficulty: 'Medium',
      questionText: 'What is 20% of 150?',
      options: ['20', '30', '40', '50'],
      correctAnswer: 1,
      explanation: '150 * 0.2 = 30'
    });
    await apt.save();
  }

  // Create OA Def
  await OADefinition.deleteMany({ company: amazon._id });
  
  const oa = new OADefinition({
    company: amazon._id,
    name: 'Amazon SDE-1 Official Assessment',
    description: 'This simulation matches the exact pattern of the Amazon SDE-1 OA. You will have 90 minutes to complete 2 coding questions and 1 aptitude section.',
    totalDurationMinutes: 90,
    sections: [
      {
        title: 'Coding Section',
        type: 'Coding',
        questions: problems.map(p => p._id)
      },
      {
        title: 'Aptitude Section',
        type: 'Aptitude',
        aptitudeRules: [{ category: 'Quantitative', count: 1 }]
      }
    ]
  });

  await oa.save();
  console.log('OA Definition seeded for Amazon');
  process.exit(0);
}

seed();
