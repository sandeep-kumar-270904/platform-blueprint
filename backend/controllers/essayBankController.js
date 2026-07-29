const EssayResponse = require('../models/EssayResponse');
const Scholarship = require('../models/Scholarship');
const geminiService = require('../services/geminiService');

exports.createEssay = async (req, res) => {
  try {
    const { title, prompt, content, tags } = req.body;
    const essay = new EssayResponse({
      userId: req.user.id,
      title,
      prompt,
      content,
      tags
    });
    await essay.save();
    res.status(201).json(essay);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getEssays = async (req, res) => {
  try {
    const { search, tags } = req.query;
    const query = { userId: req.user.id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags && Array.isArray(tags)) {
      query.tags = { $in: tags };
    } else if (tags) {
      query.tags = { $in: [tags] };
    }

    const essays = await EssayResponse.find(query).sort({ updatedAt: -1 });
    res.json(essays);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getEssay = async (req, res) => {
  try {
    const essay = await EssayResponse.findOne({ _id: req.params.id, userId: req.user.id });
    if (!essay) return res.status(404).json({ message: 'Not found' });
    res.json(essay);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateEssay = async (req, res) => {
  try {
    const { title, prompt, content, tags } = req.body;
    const essay = await EssayResponse.findOne({ _id: req.params.id, userId: req.user.id });
    if (!essay) return res.status(404).json({ message: 'Not found' });

    if (title !== undefined) essay.title = title;
    if (prompt !== undefined) essay.prompt = prompt;
    if (content !== undefined) essay.content = content;
    if (tags !== undefined) essay.tags = tags;

    await essay.save();
    res.json(essay);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteEssay = async (req, res) => {
  try {
    const essay = await EssayResponse.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!essay) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.adaptEssay = async (req, res) => {
  try {
    const { targetScholarshipId, targetPromptFieldKey } = req.body;
    
    const essay = await EssayResponse.findOne({ _id: req.params.id, userId: req.user.id });
    if (!essay) return res.status(404).json({ message: 'Essay not found' });

    const scholarship = await Scholarship.findById(targetScholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Target scholarship not found' });

    let targetPromptText = '';
    const reqField = scholarship.inAppRequirements.find(r => r.fieldKey === targetPromptFieldKey);
    if (reqField && reqField.type === 'essay') {
      targetPromptText = reqField.prompt;
    } else {
      return res.status(400).json({ message: 'Target field is not an essay or not found' });
    }

    const suggestion = await geminiService.generateText(
      `You are a scholarship essay advisor. Adapt the following source essay to better fit the target scholarship prompt.

Target Scholarship Title: ${scholarship.title}
Target Prompt: ${targetPromptText}

Source Essay Content:
${essay.content}

Provide only the adapted essay text.`
    );

    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
