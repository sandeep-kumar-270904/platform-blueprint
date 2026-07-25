const mongoose = require('mongoose');
const User = require('../models/User');
const NewsArticle = require('../models/NewsArticle');
const NewsSourceHealth = require('../models/NewsSourceHealth');

async function seedLocalFallback() {
  try {
    // Check if already seeded
    const count = await NewsArticle.countDocuments();
    if (count > 0) return;

    console.log('🌱 Seeding local fallback database with test data...');

    // 1. Create a test admin user
    const admin = new User({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    });
    await admin.save();
    const jwt = require('jsonwebtoken');
    console.log("================ ADMIN TOKEN ================");
    console.log(jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'your-secret-key'));
    console.log("=============================================");

    // 2. Create a normal user with preferences
    const user = new User({
      email: 'user@test.com',
      password: 'password123',
      role: 'student',
      firstName: 'Test',
      lastName: 'User',
      newsPreferences: {
        followedCategories: ['AI', 'Startups'],
        followedTags: ['OpenAI'],
        mutedSources: ['BadNews']
      }
    });
    await user.save();

    // 3. Seed Articles
    const articles = [
      {
        title: 'Anthropic Announces Claude 3 Opus',
        summary: 'The latest model surpasses GPT-4 on key benchmarks.',
        sourceLink: 'https://techcrunch.com/anthropic',
        sourceName: 'TechCrunch',
        category: 'AI',
        tags: ['Anthropic', 'LLM'],
        status: 'live',
        publishedAt: new Date(),
        viewCount: 150
      },
      {
        title: 'Nvidia Stock Soars After Earnings',
        summary: 'Revenue triples as AI chip demand continues to grow.',
        sourceLink: 'https://wired.com/nvidia',
        sourceName: 'Wired',
        category: 'Gadgets',
        tags: ['Nvidia', 'Stocks'],
        status: 'live',
        publishedAt: new Date(Date.now() - 86400000),
        viewCount: 300
      },
      {
        title: 'New Startup Raises $50M for AI Agents',
        summary: 'Funding led by a16z to build autonomous agents.',
        sourceLink: 'https://newsapi.com/startup',
        sourceName: 'NewsAPI',
        category: 'Startups',
        tags: ['Funding', 'Agents'],
        status: 'live',
        publishedAt: new Date(Date.now() - 2 * 86400000),
        viewCount: 75
      },
      {
        title: 'Clickbait Article from Bad Source',
        summary: 'You wont believe what happened next.',
        sourceLink: 'https://badnews.com/1',
        sourceName: 'BadNews',
        category: 'Big Tech',
        tags: [],
        status: 'live',
        publishedAt: new Date(),
        viewCount: 5
      }
    ];

    await NewsArticle.insertMany(articles);

    console.log('✅ Seeding complete.');
  } catch (err) {
    console.error('❌ Failed to seed local fallback DB:', err.message);
  }
}

module.exports = seedLocalFallback;
