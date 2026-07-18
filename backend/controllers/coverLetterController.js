const CoverLetter = require('../models/CoverLetter');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');

exports.getCoverLetters = async (req, res) => {
  try {
    const letters = await CoverLetter.find({ user_id: req.user.id }).sort({ updatedAt: -1 });
    res.json(letters);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cover letters', error: err.message });
  }
};

exports.getCoverLetter = async (req, res) => {
  try {
    const letter = await CoverLetter.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!letter) return res.status(404).json({ message: 'Not found' });
    res.json(letter);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cover letter', error: err.message });
  }
};

exports.createCoverLetter = async (req, res) => {
  try {
    const { title, resumeId, jobTitle, companyName, jobDescription, content, tone } = req.body;
    const letter = new CoverLetter({
      user_id: req.user.id,
      title: title || 'Untitled Cover Letter',
      resumeId, jobTitle, companyName, jobDescription, content, tone
    });
    await letter.save();
    res.status(201).json(letter);
  } catch (err) {
    res.status(500).json({ message: 'Error creating cover letter', error: err.message });
  }
};

exports.updateCoverLetter = async (req, res) => {
  try {
    const letter = await CoverLetter.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!letter) return res.status(404).json({ message: 'Not found' });
    res.json(letter);
  } catch (err) {
    res.status(500).json({ message: 'Error updating cover letter', error: err.message });
  }
};

exports.deleteCoverLetter = async (req, res) => {
  try {
    const letter = await CoverLetter.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!letter) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting cover letter', error: err.message });
  }
};

exports.generateContent = async (req, res) => {
  try {
    const { resumeId, jobDescription, tone } = req.body;
    
    let resumeData = {};
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, user_id: req.user.id });
      if (resume) resumeData = resume.toObject();
    }

    const content = await geminiService.generateCoverLetter(resumeData, jobDescription, tone, req.user.id);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ message: 'Error generating cover letter', error: err.message });
  }
};
