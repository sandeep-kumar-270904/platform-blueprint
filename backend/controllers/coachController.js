const CoachSession = require('../models/CoachSession');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');

exports.getSession = async (req, res) => {
  try {
    let session = await CoachSession.findOne({ userId: req.user.id });
    if (!session) {
      session = new CoachSession({ userId: req.user.id, conversationHistory: [], focusAreas: [] });
      await session.save();
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const ScholarshipApplication = require('../models/ScholarshipApplication');
const SavedScholarship = require('../models/SavedScholarship');
const EssayResponse = require('../models/EssayResponse');

exports.sendMessage = async (req, res) => {
  try {
    const { message, contextType } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    let session = await CoachSession.findOne({ userId: req.user.id });
    if (!session) {
      session = new CoachSession({ userId: req.user.id, conversationHistory: [], focusAreas: [] });
    }

    let dynamicContext = {};
    
    if (contextType === 'scholarships') {
      const apps = await ScholarshipApplication.find({ userId: req.user.id }).populate('scholarshipId');
      const saved = await SavedScholarship.find({ userId: req.user.id }).populate('scholarshipId');
      const essays = await EssayResponse.find({ userId: req.user.id });
      
      dynamicContext = {
        type: 'scholarships',
        activeApplications: apps.length,
        savedScholarships: saved.length,
        essaysAvailable: essays.length,
        applications: apps.map(a => ({ status: a.status, title: a.scholarshipId?.title })),
        saved: saved.map(s => ({ title: s.scholarshipId?.title, deadline: s.scholarshipId?.applicationDeadline }))
      };
    } else {
      // Find default resume for context
      const resume = await Resume.findOne({ user_id: req.user.id, is_default: true }) 
                     || await Resume.findOne({ user_id: req.user.id }).sort({ updated_at: -1 });

      dynamicContext = resume ? { type: 'resume', ...resume.toObject() } : { type: 'resume', note: "No resume found for this user." };
    }

    session.conversationHistory.push({ role: 'user', message });

    // Fetch reply from Gemini
    const replyData = await geminiService.chatWithCoach(
      session.conversationHistory,
      message,
      dynamicContext,
      req.user.id
    );

    session.conversationHistory.push({ role: 'coach', message: replyData.message });
    session.focusAreas = Array.from(new Set([...session.focusAreas, ...(replyData.newFocusAreas || [])]));
    session.lastInteractionAt = new Date();
    
    await session.save();

    res.json({
      reply: replyData.message,
      focusAreas: session.focusAreas,
      session
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.clearSession = async (req, res) => {
  try {
    await CoachSession.findOneAndDelete({ userId: req.user.id });
    res.json({ message: 'Session cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
