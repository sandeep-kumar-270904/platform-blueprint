const RecommendationLetter = require('../models/RecommendationLetter');
const User = require('../models/User');
const crypto = require('crypto');
const geminiService = require('../services/geminiService');
const Notification = require('../models/Notification');

exports.requestRecommendation = async (req, res) => {
  try {
    const { writerId, externalEmail, relationship,
      resumeSnapshot: resume ? resume.toObject() : undefined, resumeId } = req.body;
    const Resume = require('../models/Resume');
    const resume = resumeId ? await Resume.findById(resumeId) : await Resume.findOne({ user_id: req.user.id, isDefault: true });
    
    let token = null;
    let status = 'requested';

    if (externalEmail && !writerId) {
      token = crypto.randomBytes(20).toString('hex');
    }

    const rec = new RecommendationLetter({
      requestedBy: req.user.id,
      writtenBy: writerId || null,
      externalEmail,
      relationship,
      resumeSnapshot: resume ? resume.toObject() : undefined,
      status,
      publicToken: token
    });

    await rec.save();

    if (writerId) {
      // Internal notification
      const notif = new Notification({
        user: writerId,
        type: 'message',
        title: 'Recommendation Request',
        message: `You have received a recommendation letter request.`,
        link: `/recommendations/manage`
      });
      await notif.save();
    } else {
      // In a real app, send email with token link: `/public/recommendation/${token}`
    }
    
    res.status(201).json(rec);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRecommendationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const rec = await RecommendationLetter.findOne({ publicToken: token }).populate('requestedBy', 'name');
    if (!rec) return res.status(404).json({ message: 'Invalid or expired token' });
    
    res.json({
      requesterName: rec.requestedBy.name,
      relationship: rec.relationship,
      resumeSnapshot: resume ? resume.toObject() : undefined,
      status: rec.status,
      content: rec.content
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.draftWithAI = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestNotes, token } = req.body; // Can use token for unauth or id for auth
    
    let rec;
    if (token) {
      rec = await RecommendationLetter.findOne({ publicToken: token });
    } else {
      rec = await RecommendationLetter.findById(id);
      if (rec && rec.writtenBy && rec.writtenBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (!rec) return res.status(404).json({ message: 'Not found' });

    const draft = await geminiService.draftRecommendation(rec.relationship,
      resumeSnapshot: resume ? resume.toObject() : undefined, requestNotes);
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, token } = req.body;
    
    let rec;
    if (token) {
      rec = await RecommendationLetter.findOne({ publicToken: token });
    } else {
      rec = await RecommendationLetter.findById(id);
      if (rec && rec.writtenBy && rec.writtenBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (!rec) return res.status(404).json({ message: 'Not found' });
    if (rec.status === 'submitted') return res.status(400).json({ message: 'Already submitted' });

    rec.content = content;
    rec.status = 'submitted';
    if (token) rec.publicToken = null; // consume token
    
    await rec.save();

    // Notify requester
    const notif = new Notification({
      user: rec.requestedBy,
      type: 'message',
      title: 'Recommendation Received',
      message: `Your recommendation request has been completed.`,
      link: `/resume/recommendations`
    });
    await notif.save();

    res.json({ message: 'Recommendation submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await RecommendationLetter.find({ requestedBy: req.user.id }).populate('writtenBy', 'name email profilePicture');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    const rec = await RecommendationLetter.findById(id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    if (rec.requestedBy.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    rec.isPublished = isPublished;
    await rec.save();
    res.json(rec);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
