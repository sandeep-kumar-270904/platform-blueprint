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

// POST /api/ai/connection-assistant
router.post('/connection-assistant', authMiddleware, async (req, res) => {
  try {
    const { intent, alumniName, userProfile } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        message: `Hi ${alumniName}, I saw your profile and would love to connect to discuss ${intent}. (Mock AI Response)`
      });
    }

    const prompt = `
      You are an AI assistant helping a student write a professional connection request message on an alumni networking platform.
      The student wants to connect with ${alumniName}. 
      The stated intent for the connection is: ${intent}.
      Keep the message under 300 characters. Be polite, professional, and concise. Do not include placeholders like [Your Name].
      Message:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ message: response.text().trim() });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({ message: 'Error generating message', error: error.message });
  }
});

// POST /api/ai/session-prep
router.post('/session-prep', authMiddleware, async (req, res) => {
  try {
    const { alumniName, alumniRole, alumniCompany, alumniHistory } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        notes: `Mock Prep Notes for meeting with ${alumniName}:\n1. Ask about their role at ${alumniCompany}.\n2. Ask for general career advice.`
      });
    }

    const prompt = `
      You are an AI assistant helping a student prepare for a 1:1 mentorship session.
      The student is meeting with ${alumniName}, who is currently a ${alumniRole} at ${alumniCompany}.
      Their career history is: ${JSON.stringify(alumniHistory || [])}.
      
      Please generate a bulleted list of 3-5 highly specific, insightful questions the student should ask this alumni based on their career path and current role.
      Questions:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ notes: response.text().trim() });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({ message: 'Error generating prep notes', error: error.message });
  }
});

module.exports = router;
