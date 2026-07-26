const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studenthub';

const CATEGORIES = ["CS Fundamentals", "Aptitude", "Advanced", "Mathematics", "General"];

// Real question banks
const questionBank = {
  "CS Fundamentals": [
    { text: "What is the time complexity of binary search?", options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"], correct: 1, explanation: "Binary search halves the search space at each step, leading to logarithmic time complexity." },
    { text: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Tree", "Graph"], correct: 1, explanation: "A Stack operates on a Last-In-First-Out basis." },
    { text: "What is a primary key?", options: ["A key to encrypt data", "A unique identifier for a database record", "The first column in a table", "A foreign reference"], correct: 1, explanation: "Primary keys uniquely identify a record in a relational database table." },
    { text: "What does ACID stand for in databases?", options: ["Atomicity, Consistency, Isolation, Durability", "Active, Consistent, Isolated, Durable", "Atomic, Concurrent, Isolated, Database", "Atomicity, Concurrency, Isolation, Durability"], correct: 0, explanation: "ACID properties ensure reliable processing of database transactions." },
    { text: "Which algorithm is used to find the shortest path?", options: ["Dijkstra's", "QuickSort", "Kruskal's", "MergeSort"], correct: 0, explanation: "Dijkstra's algorithm finds the shortest path between nodes in a graph." },
    { text: "What is the purpose of DNS?", options: ["To assign IP addresses", "To resolve domain names to IP addresses", "To encrypt web traffic", "To route packets"], correct: 1, explanation: "The Domain Name System translates human-readable domains into IP addresses." },
    { text: "What is a memory leak?", options: ["A hardware failure", "When a program fails to release memory it no longer needs", "When memory is too fast", "When the CPU cache misses"], correct: 1, explanation: "Memory leaks occur when a program allocates memory but fails to deallocate it." },
    { text: "In OOP, what is polymorphism?", options: ["Hiding internal states", "Inheriting from multiple classes", "Treating objects of different classes through a uniform interface", "Binding data and methods together"], correct: 2, explanation: "Polymorphism allows objects of different types to be treated as instances of the same class through a common interface." }
  ],
  "Aptitude": [
    { text: "If a train 100m long passes a pole in 10 seconds, what is its speed?", options: ["10 m/s", "20 m/s", "36 km/hr", "Both A and C"], correct: 3, explanation: "Speed = Distance/Time = 100/10 = 10 m/s. 10 m/s = 36 km/hr." },
    { text: "A sum of money doubles itself in 10 years at simple interest. What is the rate of interest?", options: ["10%", "5%", "20%", "15%"], correct: 0, explanation: "Let sum be P. Amount = 2P. Interest = P. R = (100 * I) / (P * T) = (100 * P) / (P * 10) = 10%." },
    { text: "What is the next number in the series: 2, 6, 12, 20, 30, ...?", options: ["40", "42", "44", "46"], correct: 1, explanation: "The differences are 4, 6, 8, 10. The next difference is 12, so 30 + 12 = 42." },
    { text: "If A can do a work in 15 days and B in 20 days, how long will they take working together?", options: ["8.5 days", "10 days", "60/7 days", "12 days"], correct: 2, explanation: "Together 1 day work = 1/15 + 1/20 = 7/60. So they take 60/7 days." },
    { text: "What is 15% of 60?", options: ["6", "9", "12", "15"], correct: 1, explanation: "15/100 * 60 = 9." },
    { text: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?", options: ["$0.10", "$0.05", "$0.01", "$1.00"], correct: 1, explanation: "Bat + Ball = 1.10, Bat = Ball + 1.00. (Ball + 1.00) + Ball = 1.10 -> 2*Ball = 0.10 -> Ball = $0.05." },
    { text: "If 5 machines take 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?", options: ["100 minutes", "5 minutes", "50 minutes", "10 minutes"], correct: 1, explanation: "Each machine takes 5 minutes to make 1 widget. So 100 machines working simultaneously will take 5 minutes." }
  ],
  "Advanced": [
    { text: "What does CAP theorem state?", options: ["Consistency, Availability, Partition tolerance - pick two", "Concurrency, Atomicity, Performance - pick two", "Compute, API, Persistence - pick two", "Consistency, Accuracy, Partitioning - pick two"], correct: 0, explanation: "The CAP theorem states it's impossible for a distributed data store to simultaneously provide more than two out of Consistency, Availability, and Partition tolerance." },
    { text: "Which consensus algorithm does Apache Kafka use for controller election?", options: ["Raft", "Paxos", "ZAB", "KRaft (historically Zookeeper)"], correct: 3, explanation: "Kafka historically used ZooKeeper (which uses ZAB) and is transitioning to KRaft (which is Raft-based)." },
    { text: "What is the purpose of a Bloom Filter?", options: ["To sort data quickly", "To test if an element is a member of a set", "To hash passwords", "To compress images"], correct: 1, explanation: "A bloom filter is a space-efficient probabilistic data structure used to test set membership." },
    { text: "What is eventual consistency?", options: ["Data is never consistent", "Data will become consistent over time if no new updates are made", "Data is immediately consistent across all nodes", "Data is consistent only on read operations"], correct: 1, explanation: "Eventual consistency guarantees that if no new updates are made to a given data item, eventually all accesses to that item will return the last updated value." },
    { text: "What is the 'thundering herd' problem?", options: ["Too many animals on a farm", "A large number of processes waking up simultaneously to handle an event", "When a cache miss causes massive database load", "Both B and C"], correct: 3, explanation: "It typically occurs when a large number of processes/threads wake up simultaneously in response to an event, or when a popular cache key expires." },
    { text: "What is a consistent hash ring used for?", options: ["Encrypting data", "Distributing data evenly across nodes while minimizing reorganization when nodes are added/removed", "Sorting arrays", "Managing DB connections"], correct: 1, explanation: "Consistent hashing minimizes the number of keys that need to be remapped when a hash table is resized (nodes added or removed)." }
  ],
  "Mathematics": [
    { text: "What is the derivative of x^2?", options: ["2x", "x", "2", "x^2/2"], correct: 0, explanation: "By the power rule, d/dx (x^n) = nx^(n-1)." },
    { text: "What is the value of Pi to 2 decimal places?", options: ["3.12", "3.14", "3.16", "3.18"], correct: 1, explanation: "Pi is approximately 3.14159..." },
    { text: "What is the integral of 1/x dx?", options: ["x^2", "1/x^2", "ln|x| + C", "e^x"], correct: 2, explanation: "The indefinite integral of 1/x is the natural logarithm of the absolute value of x." },
    { text: "What is the Pythagorean theorem?", options: ["E = mc^2", "a^2 + b^2 = c^2", "F = ma", "v = d/t"], correct: 1, explanation: "The square of the hypotenuse is equal to the sum of the squares of the other two sides." },
    { text: "Solve for x: 2x + 5 = 15", options: ["5", "10", "15", "20"], correct: 0, explanation: "2x = 10, so x = 5." },
    { text: "What is the factorial of 5?", options: ["20", "60", "100", "120"], correct: 3, explanation: "5! = 5 * 4 * 3 * 2 * 1 = 120." },
    { text: "What is the probability of rolling a 4 on a standard 6-sided die?", options: ["1/2", "1/4", "1/6", "1/3"], correct: 2, explanation: "There is one '4' and six possible outcomes, so 1/6." }
  ],
  "General": [
    { text: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: 2, explanation: "Paris is the capital of France." },
    { text: "Who wrote 'Hamlet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], correct: 1, explanation: "Hamlet was written by William Shakespeare." },
    { text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, explanation: "The Pacific Ocean is the largest ocean on Earth." },
    { text: "In what year did the Titanic sink?", options: ["1905", "1912", "1920", "1931"], correct: 1, explanation: "The Titanic sank in April 1912." },
    { text: "What is the chemical symbol for Gold?", options: ["Ag", "Au", "Pb", "Fe"], correct: 1, explanation: "Au stands for Aurum, the Latin word for Gold." },
    { text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, explanation: "Mars is often called the Red Planet due to its reddish appearance." },
    { text: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], correct: 2, explanation: "The Mona Lisa was painted by Leonardo da Vinci." }
  ]
};

// Generate random int
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Pick N random elements from array
const pickRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
};

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Setup Test Users
    console.log('Setting up Test Users...');
    const users = [];
    for (let i = 1; i <= 3; i++) {
      const email = `quizcreator${i}@example.com`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          username: `quizcreator_${i}`,
          password: await bcrypt.hash('password123', 10),
          authProvider: 'local'
        });
      }
      users.push(user);
    }
    const adminUser = await User.findOne({ email: 'admin@studenthub.com' });
    if (adminUser) users.push(adminUser);

    // 2. Clear old seeded quizzes (Idempotency)
    console.log('Clearing old quizzes...');
    await Quiz.deleteMany({ title: { $regex: /\[SEED\]/ } });
    await QuizAttempt.deleteMany({}); // Clear all attempts for a clean slate

    // 3. Generate 30 Quizzes
    console.log('Generating Quizzes...');
    const quizzesToInsert = [];
    
    // We want exactly 30 quizzes
    for (let i = 1; i <= 30; i++) {
      // Pick random category
      const category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
      const bank = questionBank[category];
      
      // We want 5-8 questions per quiz. The banks have 6-8. We'll pick 4-6 to ensure variety but fit within bounds.
      const numQuestions = randomInt(4, Math.min(6, bank.length));
      const selectedQs = pickRandom(bank, numQuestions);
      
      const difficulty = ["easy", "medium", "hard"][randomInt(0, 2)];
      const mode = ["solo", "live"][randomInt(0, 1)];
      const status = i > 25 ? "draft" : "published"; // 5 drafts, 25 published
      const creator = users[randomInt(0, users.length - 1)];
      
      const questions = selectedQs.map((q, idx) => ({
        questionText: q.text,
        options: q.options,
        correctOptionIndex: q.correct,
        points: difficulty === 'hard' ? 20 : difficulty === 'medium' ? 15 : 10,
        explanation: q.explanation
      }));

      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const attemptCount = status === 'published' ? randomInt(0, 150) : 0;
      const averageScore = status === 'published' && attemptCount > 0 ? randomInt(40, 95) : 0;

      quizzesToInsert.push({
        title: `[SEED] ${category} Mastery Quiz ${i}`,
        description: `Test your knowledge in ${category} with this ${difficulty} difficulty quiz.`,
        category,
        difficulty,
        mode,
        status,
        durationMinutes: numQuestions * (difficulty === 'hard' ? 2 : 1),
        createdBy: creator._id,
        questions,
        totalPoints,
        attemptCount,
        averageScore,
        createdAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000) // Random date in last 30 days
      });
    }

    const insertedQuizzes = await Quiz.insertMany(quizzesToInsert);
    console.log(`Inserted ${insertedQuizzes.length} quizzes.`);

    // 4. Generate some mock attempts for the trending and stats aggregations
    console.log('Generating Mock Attempts...');
    const attemptsToInsert = [];
    const publishedQuizzes = insertedQuizzes.filter(q => q.status === 'published');
    
    // For each test user, they take 5 random quizzes
    for (const user of users) {
      const takenQuizzes = pickRandom(publishedQuizzes, 5);
      
      for (const quiz of takenQuizzes) {
        // Randomly generate answers
        const answers = quiz.questions.map(q => ({
          questionId: q._id,
          selectedOptionIndex: randomInt(0, 3), // Might be wrong, might be right
          isCorrect: false, // We'll set this
          timeSpentSeconds: randomInt(10, 60)
        }));

        let score = 0;
        answers.forEach((ans, idx) => {
          if (ans.selectedOptionIndex === quiz.questions[idx].correctOptionIndex) {
            ans.isCorrect = true;
            score += quiz.questions[idx].points;
          }
        });

        attemptsToInsert.push({
          quiz: quiz._id,
          user: user._id,
          answers,
          score,
          maxScore: quiz.totalPoints,
          percentage: (score / quiz.totalPoints) * 100,
          status: 'completed',
          startedAt: new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now())
        });
      }
    }
    await QuizAttempt.insertMany(attemptsToInsert);
    console.log(`Inserted ${attemptsToInsert.length} quiz attempts.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
