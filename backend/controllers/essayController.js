exports.adaptEssay = async (req, res) => {
  try {
    const { originalEssayId, scholarshipRequirements } = req.body;
    const geminiService = require('../services/geminiService');
    
    // Call gemini to adapt the essay
    const adaptedContent = await geminiService.generateText(`Adapt this essay for ${scholarshipRequirements}`);
    
    res.json({ adaptedContent });
  } catch (err) {
    res.status(500).json({ message: 'Error adapting essay', error: err.message });
  }
};
