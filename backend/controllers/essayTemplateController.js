const EssayTemplate = require('../models/EssayTemplate');
const AwardeeStory = require('../models/AwardeeStory');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const { callGeminiAPI } = require('../services/geminiService');

exports.createTemplate = async (req, res) => {
  try {
    const { promptType, fullTextShared } = req.body;
    const essayResponseId = req.params.id;
    const userId = req.user.id;

    // Hard authenticity gate: Must have an awarded application containing this essay AND a published AwardeeStory
    // We assume ScholarshipApplication has essayResponses array (Phase 3)
    const applications = await ScholarshipApplication.find({
      userId,
      status: 'awarded',
      'essayResponses.responseId': essayResponseId
    });

    if (applications.length === 0) {
      return res.status(403).json({ message: 'Must have an awarded application using this essay' });
    }

    const appIds = applications.map(app => app._id);
    const story = await AwardeeStory.findOne({
      userId,
      applicationId: { $in: appIds },
      status: 'approved'
    });

    if (!story) {
      return res.status(403).json({ message: 'Must have an approved awardee story for the application using this essay' });
    }

    // Call Gemini to generate a structural summary
    // First, find the essay content. Since we didn't store the full essayResponse model in prompt, 
    // we'll assume we can fetch it. Wait, EssayResponse is a model.
    const EssayResponse = require('../models/EssayResponse');
    const essay = await EssayResponse.findOne({ _id: essayResponseId, userId });
    
    if (!essay) {
      return res.status(404).json({ message: 'Essay not found' });
    }

    const prompt = `Analyze this scholarship essay and write a structural summary describing how it is written. DO NOT include identifying information. Essay:\n${essay.content}`;
    const structuralSummary = await callGeminiAPI(prompt, 'structural_summary');

    const template = new EssayTemplate({
      sourceEssayResponseId: essay._id,
      sourceUserId: userId,
      promptType,
      structuralSummary,
      fullTextShared: fullTextShared || false,
      fullText: fullTextShared ? essay.content : null,
      status: 'draft'
    });

    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.publishTemplate = async (req, res) => {
  try {
    const { confirmPublish } = req.body;
    if (!confirmPublish) {
      return res.status(400).json({ message: 'confirmPublish flag is required' });
    }

    const template = await EssayTemplate.findOne({ _id: req.params.id, sourceUserId: req.user.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });

    template.status = 'published';
    await template.save();

    res.json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPublicTemplates = async (req, res) => {
  try {
    const { promptType } = req.query;
    const filter = { status: 'published' };
    if (promptType) filter.promptType = promptType;

    // NEVER expose sourceUserId
    const templates = await EssayTemplate.find(filter)
      .select('-sourceUserId -__v')
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await EssayTemplate.findOneAndDelete({ _id: req.params.id, sourceUserId: req.user.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
