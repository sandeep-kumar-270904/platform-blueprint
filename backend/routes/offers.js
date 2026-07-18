const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GeminiService = require('../services/geminiService');
const geminiService = new GeminiService();

// POST /api/offers/compare
router.post('/compare', auth, async (req, res) => {
  try {
    const { offers } = req.body;
    if (!offers || offers.length < 2) {
      return res.status(400).json({ message: 'At least 2 offers are required for comparison' });
    }

    const prompt = `You are a career advisor. A candidate is comparing the following job offers:\n` +
      JSON.stringify(offers, null, 2) + 
      `\n\nAnalyze the gaps and differences between these offers (e.g. one has remote work, one doesn't; compensation differences). Generate 3-5 critical, specific questions the candidate should ask the employers before making a decision based ONLY on these differences. Do not give generic advice. Return a JSON array of strings.`;

    const model = geminiService.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const questions = JSON.parse(await result.response.text());
    res.json(questions);
  } catch (error) {
    console.error('Offer compare error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
