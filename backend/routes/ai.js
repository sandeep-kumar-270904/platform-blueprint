const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// POST /api/ai/review-helper
router.post('/review-helper', authMiddleware, async (req, res) => {
  try {
    const { bulletPoints, pros, cons } = req.body;
    if (!bulletPoints && (!pros || !cons)) {
      return res.status(400).json({ message: 'Please provide some bullet points or pros/cons to expand.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Provide a mock response if no key is set so the UI doesn't break
      return res.json({
        reviewText: `This is a generated review based on your points: \nPros: ${pros}\nCons: ${cons}\n${bulletPoints}\n\n(Note: This is a placeholder because GEMINI_API_KEY is not set in the backend .env)`
      });
    }

    const prompt = `
      You are an AI assistant helping a student write a review for their college. 
      Please convert the following raw thoughts, pros, and cons into a well-structured, professional, and helpful review paragraph (max 150 words). Do not add any new information that wasn't implied by the user's input.
      
      Bullet Points/Thoughts: ${bulletPoints || 'None'}
      Pros: ${pros || 'None'}
      Cons: ${cons || 'None'}
      
      Review:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reviewText = response.text().trim();

    res.json({ reviewText });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({ message: 'Error generating review text', error: error.message });
  }
});

module.exports = router;
