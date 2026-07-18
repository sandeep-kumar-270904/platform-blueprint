const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ForumThread = require('../models/ForumThread');
const ForumReply = require('../models/ForumReply');
const QAQuestion = require('../models/QAQuestion');
const QAAnswer = require('../models/QAAnswer');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const Report = require('../models/Report');

// --- FORUMS ---

router.get('/forums', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isHidden: false };
    if (category) filter.category = category;
    const threads = await ForumThread.find(filter).sort({ is_pinned: -1, last_activity_at: -1 }).populate('user_id', 'full_name avatar_url role');
    res.json({ threads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forums', auth, async (req, res) => {
  try {
    const thread = new ForumThread({
      user_id: req.user.id,
      title: req.body.title,
      body: req.body.body,
      category: req.body.category,
      tags: req.body.tags || []
    });
    await thread.save();
    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/forums/:id', auth, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id).populate('user_id', 'full_name avatar_url role');
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.isHidden) return res.status(403).json({ message: 'Thread is hidden' });

    thread.view_count += 1;
    await thread.save();
    
    const replies = await ForumReply.find({ thread_id: thread._id, isHidden: false }).sort({ like_count: -1, createdAt: 1 }).populate('user_id', 'full_name avatar_url role');
    res.json({ thread, replies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forums/:id/reply', auth, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.is_locked) return res.status(403).json({ message: 'Thread is locked' });

    const reply = new ForumReply({
      thread_id: thread._id,
      user_id: req.user.id,
      body: req.body.body,
      parent_id: req.body.parent_id || null
    });
    await reply.save();
    
    thread.reply_count += 1;
    thread.last_activity_at = Date.now();
    await thread.save();
    
    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forums/replies/:replyId/upvote', auth, async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (reply.liked_by.includes(req.user.id)) return res.json(reply);
    
    reply.liked_by.push(req.user.id);
    reply.like_count += 1;
    await reply.save();
    res.json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forums/:id/report', auth, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const existing = await Report.findOne({ content_type: 'forum_thread', content_id: thread._id, reported_by: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already reported' });

    const report = new Report({
      content_type: 'forum_thread',
      content_id: thread._id,
      reported_by: req.user.id,
      reason: req.body.reason || 'Inappropriate content'
    });
    await report.save();

    const count = await Report.countDocuments({ content_type: 'forum_thread', content_id: thread._id, status: 'pending' });
    if (count >= 3) {
      thread.isHidden = true;
      await thread.save();
    }
    res.json({ message: 'Reported successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forums/replies/:replyId/report', auth, async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const existing = await Report.findOne({ content_type: 'forum_reply', content_id: reply._id, reported_by: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already reported' });

    const report = new Report({
      content_type: 'forum_reply',
      content_id: reply._id,
      reported_by: req.user.id,
      reason: req.body.reason || 'Inappropriate content'
    });
    await report.save();

    const count = await Report.countDocuments({ content_type: 'forum_reply', content_id: reply._id, status: 'pending' });
    if (count >= 3) {
      reply.isHidden = true;
      await reply.save();
    }
    res.json({ message: 'Reported successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- PEER Q&A ---

router.get('/qa', auth, async (req, res) => {
  try {
    const { tag, status } = req.query;
    const filter = {};
    if (tag) filter.tags = tag;
    if (status) filter.status = status;
    const questions = await QAQuestion.find(filter).sort({ createdAt: -1 }).populate('user_id', 'full_name avatar_url role');
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/qa', auth, async (req, res) => {
  try {
    const q = new QAQuestion({
      user_id: req.user.id,
      title: req.body.title,
      body: req.body.body,
      category: req.body.category || 'General',
      tags: req.body.tags || []
    });
    await q.save();
    res.status(201).json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/qa/:id', auth, async (req, res) => {
  try {
    const question = await QAQuestion.findById(req.params.id).populate('user_id', 'full_name avatar_url role');
    if (!question) return res.status(404).json({ message: 'Not found' });
    
    const answers = await QAAnswer.find({ question_id: question._id }).sort({ is_accepted: -1, upvotes: -1, createdAt: 1 }).populate('user_id', 'full_name avatar_url role');
    res.json({ question, answers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/qa/:id/answer', auth, async (req, res) => {
  try {
    const question = await QAQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Not found' });

    // Check if user is a verified mentor
    const user = await User.findById(req.user.id);
    let isMentorVerified = false;
    if (user.role === 'mentor' && user.institutionVerified) {
      isMentorVerified = true;
    } else if (user.role === 'mentor') {
      const profile = await MentorProfile.findOne({ user_id: req.user.id });
      if (profile && profile.verificationStatus === 'approved') isMentorVerified = true;
    }

    const answer = new QAAnswer({
      question_id: question._id,
      user_id: req.user.id,
      body: req.body.body,
      isMentorVerified
    });
    await answer.save();

    question.answer_count += 1;
    if (question.status === 'open') question.status = 'answered';
    await question.save();

    res.status(201).json(answer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/qa/answers/:answerId/accept', auth, async (req, res) => {
  try {
    const answer = await QAAnswer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Not found' });
    const question = await QAQuestion.findById(answer.question_id);
    
    // Only asker can accept
    if (question.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Only asker can accept' });

    // Unaccept others
    await QAAnswer.updateMany({ question_id: question._id }, { $set: { is_accepted: false } });
    answer.is_accepted = true;
    await answer.save();

    question.status = 'closed';
    await question.save();
    
    res.json(answer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ALUMNI DIRECTORY ---

router.get('/alumni', auth, async (req, res) => {
  try {
    const { year, company, field } = req.query;
    const filter = { isActive: true, graduationYear: { $exists: true } };
    if (year) filter.graduationYear = parseInt(year);
    if (company) filter.currentCompany = new RegExp(company, 'i');
    if (field) filter.expertise = field; // matching expertise

    const alumni = await MentorProfile.find(filter)
      .populate('user_id', 'full_name avatar_url university degree')
      .select('title company bio expertise yearsOfExperience graduationYear currentCompany currentRole willingToRefer openToInformalChat');
    
    res.json({ alumni });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
