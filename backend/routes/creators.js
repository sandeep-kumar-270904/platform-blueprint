const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const CreatorContent = require('../models/CreatorContent');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/creators/content - Public feed of published content
router.get('/content', async (req, res) => {
  try {
    const { type, search, sort } = req.query;
    const query = { status: 'published' };
    const validTypes = ['article', 'video', 'project', 'resource'];
    if (type && type !== 'all' && validTypes.includes(type)) {
      query.type = type;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    let sortObj = { createdAt: -1 };
    if (sort === 'viewed') sortObj = { views: -1, createdAt: -1 };
    else if (sort === 'liked') sortObj = { likes: -1, createdAt: -1 };

    const items = await CreatorContent.find(query)
      .sort(sortObj)
      .populate('userId', 'name email profilePicture');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching feed', error: err.message });
  }
});

// GET /api/creators/content/my - Logged-in user's content (both draft and published)
router.get('/content/my', authMiddleware, async (req, res) => {
  try {
    const { type, search, sort } = req.query;
    const query = { userId: req.user.id };
    const validTypes = ['article', 'video', 'project', 'resource'];
    if (type && type !== 'all' && validTypes.includes(type)) {
      query.type = type;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    let sortObj = { createdAt: -1 };
    if (sort === 'viewed') sortObj = { views: -1, createdAt: -1 };
    else if (sort === 'liked') sortObj = { likes: -1, createdAt: -1 };

    const items = await CreatorContent.find(query)
      .sort(sortObj)
      .populate('userId', 'name email profilePicture');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching my content', error: err.message });
  }
});

// POST /api/creators/content - Create new content piece
router.post('/content', authMiddleware, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid upload payload' });
    }
    const { title, type, description, body, thumbnail, status, tags } = req.body;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Title is required and must be a text string', field: 'title' });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ message: 'Content body/media is required and must be a text string', field: 'body' });
    }

    // Check for rapid duplicate submission (within last 15 seconds)
    const recentDuplicate = await CreatorContent.findOne({
      userId: req.user.id,
      title: title.trim(),
      body: body.trim(),
      createdAt: { $gte: new Date(Date.now() - 15 * 1000) }
    });
    if (recentDuplicate) {
      return res.status(409).json({ message: 'Duplicate submission detected. Please wait a moment before submitting identical content.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validTypes = ['article', 'video', 'project', 'resource'];
    const validStatuses = ['draft', 'published'];

    const newItem = new CreatorContent({
      userId: req.user.id,
      creatorName: user.name || 'Anonymous Creator',
      creatorAvatar: user.profilePicture || '',
      title: title.trim(),
      type: validTypes.includes(type) ? type : 'article',
      description: (description && typeof description === 'string') ? description.trim() : body.trim().substring(0, 150),
      body: body.trim(),
      thumbnail: (thumbnail && typeof thumbnail === 'string') ? thumbnail : '✨',
      status: validStatuses.includes(status) ? status : 'published',
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [])
    });

    await newItem.save();
    const populated = await CreatorContent.findById(newItem._id).populate('userId', 'name email profilePicture');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error creating content', error: err.message });
  }
});

// PUT /api/creators/content/:id - Update content piece
router.put('/content/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid update payload' });
    }
    const { title, type, description, body, thumbnail, status, tags } = req.body;
    const item = await CreatorContent.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Content not found' });
    }
    if (item.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to edit this content' });
    }
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ message: 'Title cannot be empty', field: 'title' });
      item.title = title.trim();
    }
    if (body !== undefined) {
      if (typeof body !== 'string' || !body.trim()) return res.status(400).json({ message: 'Content body cannot be empty', field: 'body' });
      item.body = body.trim();
    }
    const validTypes = ['article', 'video', 'project', 'resource'];
    const validStatuses = ['draft', 'published'];
    if (type !== undefined && validTypes.includes(type)) item.type = type;
    if (description !== undefined && typeof description === 'string') item.description = description.trim();
    if (thumbnail !== undefined && typeof thumbnail === 'string') item.thumbnail = thumbnail;
    if (status !== undefined && validStatuses.includes(status)) item.status = status;
    if (tags !== undefined) {
      item.tags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    await item.save();
    const populated = await CreatorContent.findById(item._id).populate('userId', 'name email profilePicture');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating content', error: err.message });
  }
});

// DELETE /api/creators/content/:id - Delete content piece
router.delete('/content/:id', authMiddleware, async (req, res) => {
  try {
    const item = await CreatorContent.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Content not found' });
    }
    if (item.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this content' });
    }
    await CreatorContent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting content', error: err.message });
  }
});

// POST /api/creators/content/:id/like - Toggle like
router.post('/content/:id/like', authMiddleware, async (req, res) => {
  try {
    const item = await CreatorContent.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Content not found' });

    const userId = req.user.id;
    const index = item.likedBy.indexOf(userId);
    if (index === -1) {
      item.likedBy.push(userId);
      item.likes += 1;
    } else {
      item.likedBy.splice(index, 1);
      item.likes = Math.max(0, item.likes - 1);
    }
    await item.save();
    res.json({ likes: item.likes, isLiked: index === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling like', error: err.message });
  }
});

// POST /api/creators/content/:id/view - Increment view count
router.post('/content/:id/view', async (req, res) => {
  try {
    const item = await CreatorContent.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Content not found' });
    res.json({ views: item.views });
  } catch (err) {
    res.status(500).json({ message: 'Error incrementing views', error: err.message });
  }
});

// POST /api/creators/content/seed - Generate realistic demo feed if empty
router.post('/content/seed', authMiddleware, async (req, res) => {
  try {
    const count = await CreatorContent.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Feed already has content', count });
    }
    const user = await User.findById(req.user.id);
    const demoItems = [
      {
        userId: req.user.id,
        creatorName: user?.name || 'Alex Chen',
        creatorAvatar: user?.profilePicture || '',
        title: 'Complete Guide to Mastering System Design Interviews in 2026',
        type: 'article',
        description: 'A comprehensive roadmap covering load balancing, distributed caching, database sharding, and real-time streaming architectures.',
        body: 'System design interviews require a deep understanding of scalability, availability, and consistency. In this guide, we break down how to design scalable systems like Twitter, Uber, and Netflix from scratch. Start with defining clear functional and non-functional requirements...',
        thumbnail: '🏗️',
        status: 'published',
        views: 1240,
        likes: 185,
        commentsCount: 24,
        tags: ['SystemDesign', 'InterviewPrep', 'Architecture']
      },
      {
        userId: req.user.id,
        creatorName: user?.name || 'Priya Sharma',
        creatorAvatar: user?.profilePicture || '',
        title: 'Building a Fullstack AI Assistant with React & Node.js (Video Course)',
        type: 'video',
        description: 'Watch step-by-step as we build a streaming LLM chatbot with custom plugins, vector search, and WebSocket real-time updates.',
        body: 'https://www.youtube.com/watch?v=demo_video_link\nIn this video tutorial, we explore how to integrate OpenAI and Gemini APIs with a custom Node.js backend and a sleek TailwindCSS React frontend.',
        thumbnail: '🎥',
        status: 'published',
        views: 3420,
        likes: 492,
        commentsCount: 68,
        tags: ['AI', 'React', 'NodeJS', 'Fullstack']
      },
      {
        userId: req.user.id,
        creatorName: 'Marcus Vance',
        creatorAvatar: '',
        title: 'Open Source ATS Resume Analyzer & Score Booster (GitHub Project)',
        type: 'project',
        description: 'An open-source NLP tool that checks your resume against job descriptions and provides actionable keyword recommendations.',
        body: 'Check out the repository on GitHub! Built using Python, FastAPI, and React. Contributions and pull requests are welcome from fellow students and developers looking to improve their open-source portfolio.',
        thumbnail: '💻',
        status: 'published',
        views: 890,
        likes: 134,
        commentsCount: 15,
        tags: ['OpenSource', 'Resume', 'ATS', 'Python']
      },
      {
        userId: req.user.id,
        creatorName: 'Elena Rostova',
        creatorAvatar: '',
        title: 'Curated UI/UX Design System Checklist & Figma Starter Kit',
        type: 'resource',
        description: 'Free downloadable design tokens, accessible color palettes, typography scales, and responsive component layouts for students.',
        body: 'Download the Figma community file and start designing premium web applications faster. Includes dark mode guidelines, glassmorphism styles, and micro-animation specs.',
        thumbnail: '🎨',
        status: 'published',
        views: 2150,
        likes: 310,
        commentsCount: 42,
        tags: ['Design', 'UIUX', 'Figma', 'Frontend']
      }
    ];

    const created = await CreatorContent.insertMany(demoItems);
    res.status(201).json({ message: 'Seeded 4 demo creator content items!', items: created });
  } catch (err) {
    res.status(500).json({ message: 'Error seeding demo content', error: err.message });
  }
});

// GET /api/creators/quiz-analytics-overview
router.get('/quiz-analytics-overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const quizzes = await Quiz.find({ createdBy: userId });
    
    let totalQuizzes = quizzes.length;
    let totalAttempts = 0;
    let sumAverageScore = 0;
    
    let bestQuiz = null;
    let bestCompletionRate = -1;

    const quizList = [];

    for (const quiz of quizzes) {
      totalAttempts += (quiz.attemptCount || 0);
      sumAverageScore += (quiz.averageScore || 0);
      
      const completed = await QuizAttempt.countDocuments({ quiz: quiz._id, status: 'completed' });
      const total = await QuizAttempt.countDocuments({ quiz: quiz._id });
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      if (completionRate > bestCompletionRate && total > 0) {
        bestCompletionRate = completionRate;
        bestQuiz = {
          _id: quiz._id,
          title: quiz.title,
          completionRate
        };
      }
      
      quizList.push({
        _id: quiz._id,
        title: quiz.title,
        attemptCount: quiz.attemptCount,
        averageScore: quiz.averageScore,
        completionRate
      });
    }
    
    const overallAverageScore = totalQuizzes > 0 ? sumAverageScore / totalQuizzes : 0;

    res.json({
      totalQuizzes,
      totalAttempts,
      overallAverageScore,
      bestPerformingQuiz: bestQuiz,
      quizzes: quizList
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
