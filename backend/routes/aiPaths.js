const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PersonalizedLearningPath = require('../models/PersonalizedLearningPath');
const MentorProfile = require('../models/MentorProfile');
const Quiz = require('../models/Quiz');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many AI requests, please try again later.' }
});

router.post('/generate', auth, aiLimiter, async (req, res) => {
  try {
    const { goal, category } = req.body;
    if (!goal || !category) return res.status(400).json({ message: 'Goal and category are required' });

    // Fetch real data to seed the prompt
    const mentors = await MentorProfile.find({ expertise: category, verificationStatus: 'approved' })
      .populate('user_id', 'full_name')
      .limit(5).lean();
      
    const quizzes = await Quiz.find({ category, status: 'published' }).limit(5).lean();

    const mentorData = mentors.map(m => `Mentor: ${m.user_id?.full_name || 'Expert'} (ID: ${m._id})`).join('\n');
    const quizData = quizzes.map(q => `Quiz: ${q.title} (ID: ${q._id})`).join('\n');

    const prompt = `
You are an expert learning path generator. The user has the following goal: "${goal}" in the category "${category}".
Create a personalized, step-by-step learning path (up to 5 steps).
Use the following real platform resources where applicable. If a step should link to one of these resources, include its ID. If a step is generic (e.g. read a resource), omit the ID.

Available Mentors:
${mentorData || 'None'}

Available Quizzes:
${quizData || 'None'}

Return ONLY a valid JSON object in this exact format:
{
  "steps": [
    {
      "title": "Step title",
      "description": "Step description",
      "suggestedAction": "book_mentor" | "take_quiz" | "apply_job" | "read_resource",
      "targetId": "the ID of the mentor/quiz, if applicable, otherwise omit"
    }
  ]
}
    `;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.json({
        id: "mock_path_1",
        title: `AI Path for ${goal}`,
        description: `This is a mock learning path because the Gemini API key is missing.`,
        duration: "4 weeks",
        modules: [
          { title: "Module 1", description: "Mock intro", duration: "1 week", type: "course" }
        ]
      });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response:', text);
      return res.status(500).json({ message: 'Failed to generate a valid learning path' });
    }

    const path = new PersonalizedLearningPath({
      userId: req.user.id,
      goal,
      category,
      generatedSteps: parsed.steps
    });
    await path.save();

    res.status(201).json({ path });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-paths', auth, async (req, res) => {
  try {
    const paths = await PersonalizedLearningPath.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ paths });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/steps/:stepId/complete', auth, async (req, res) => {
  try {
    const path = await PersonalizedLearningPath.findOne({ _id: req.params.id, userId: req.user.id });
    if (!path) return res.status(404).json({ message: 'Path not found' });

    const step = path.generatedSteps.id(req.params.stepId);
    if (!step) return res.status(404).json({ message: 'Step not found' });

    step.completed = req.body.completed;
    if (step.completed) step.completedAt = new Date();
    else step.completedAt = null;

    await path.save();
    res.json({ path });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
