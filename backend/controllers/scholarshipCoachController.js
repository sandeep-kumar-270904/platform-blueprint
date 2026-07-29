const ScholarshipCoachSession = require('../models/ScholarshipCoachSession');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const SavedScholarship = require('../models/SavedScholarship');
const EssayResponse = require('../models/EssayResponse');
const geminiService = require('../services/geminiService');

exports.getSession = async (req, res) => {
  try {
    let session = await ScholarshipCoachSession.findOne({ userId: req.user.id });
    if (!session) {
      session = new ScholarshipCoachSession({
        userId: req.user.id,
        conversationHistory: []
      });
      await session.save();
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    let session = await ScholarshipCoachSession.findOne({ userId: req.user.id });
    if (!session) {
      session = new ScholarshipCoachSession({
        userId: req.user.id,
        conversationHistory: []
      });
    }

    // Fetch real context
    const savedScholarships = await SavedScholarship.find({ userId: req.user.id }).populate('scholarshipId', 'title amount applicationDeadline').limit(5);
    const applications = await ScholarshipApplication.find({ userId: req.user.id }).populate('scholarshipId', 'title').limit(5);
    const essays = await EssayResponse.find({ userId: req.user.id }).limit(3);

    const contextContext = `
      User's Recent Saved Scholarships: ${JSON.stringify(savedScholarships.map(s => ({ title: s.scholarshipId?.title || 'Unknown', amount: s.scholarshipId?.amount })))}
      User's Recent Applications: ${JSON.stringify(applications.map(a => ({ title: a.scholarshipId?.title, status: a.status })))}
      User's Saved Essays: ${JSON.stringify(essays.map(e => ({ title: e.title, timesUsed: e.timesUsed })))}
    `;

    // Append user message
    session.conversationHistory.push({ role: 'user', message });

    // We build the full prompt logic for Gemini:
    const systemPrompt = `You are a task-focused AI assistant for scholarship strategy. Do not imply a human relationship or emotional-support role. Focus strictly on helping the user find, apply for, and manage scholarships. 
IMPORTANT: When suggesting or discussing scholarships, you MUST strictly extract and state the exact scholarship amount from the context or the user's input. Do not generate placeholders like [Amount] or estimate amounts.
Use the following context about the user's progress:\n${contextContext}\n\n`;

    const chatHistory = session.conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.message}`).join('\n');
    
    let assistantResponseText = '';
    try {
      assistantResponseText = await geminiService.generateText(systemPrompt + chatHistory + '\nASSISTANT:');
    } catch (apiError) {
      // Return structured error without polluting conversation history
      return res.status(502).json({ message: 'Failed to communicate with AI provider. Please try again later.' });
    }

    // Append assistant response on success
    session.conversationHistory.push({ role: 'assistant', message: assistantResponseText });
    session.lastInteractionAt = new Date();
    await session.save();

    res.json({ message: assistantResponseText, session });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
