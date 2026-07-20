const SuccessStory = require('../models/SuccessStory');
const Resume = require('../models/Resume');
const PortfolioPage = require('../models/PortfolioPage');
const geminiService = require('../services/geminiService');
const Notification = require('../models/Notification');

exports.getMyStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find({ userId: req.user.id });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createStory = async (req, res) => {
  try {
    const story = new SuccessStory({
      userId: req.user.id,
      ...req.body
    });
    
    if (req.body.status === 'submitted') {
      story.submittedAt = new Date();
    }
    
    await story.save();
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const story = await SuccessStory.findOne({ _id: req.params.id, userId: req.user.id });
    if (!story) return res.status(404).json({ message: 'Not found' });
    
    if (story.status === 'published' || story.status === 'approved') {
      return res.status(403).json({ message: 'Cannot edit an approved/published story. Contact support.' });
    }

    Object.assign(story, req.body);
    if (req.body.status === 'submitted' && story.status !== 'submitted') {
      story.submittedAt = new Date();
    }

    await story.save();
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.polishStory = async (req, res) => {
  try {
    const { narrative } = req.body;
    // Uses gemini to polish
    let polished = narrative;
    if (geminiService.isMock) {
      polished = narrative + " (Polished for clarity and impact.)";
    } else {
      const model = geminiService.genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `You are an expert editor. Improve the following success story narrative for clarity, professionalism, and impact. Do not invent facts.\n\n${narrative}`;
      const result = await model.generateContent(prompt);
      polished = (await result.response).text();
    }
    res.json({ polished });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPublicStories = async (req, res) => {
  try {
    // Only fetch published stories
    const stories = await SuccessStory.find({ status: 'published' })
      .populate('userId', 'name avatar')
      .populate('linkedResumeId', 'title showAtsScore atsScore')
      .sort({ submittedAt: -1 });

    // Enforce privacy: strip ATS score if visibility is false
    const safeStories = stories.map(story => {
      const s = story.toObject();
      if (s.linkedResumeId && !s.linkedResumeId.showAtsScore) {
        delete s.linkedResumeId.atsScore;
      }
      return s;
    });

    res.json(safeStories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin routes
exports.getPendingStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find({ status: 'submitted' }).populate('userId', 'name email');
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveStory = async (req, res) => {
  try {
    const story = await SuccessStory.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });

    story.status = 'published';
    await story.save();

    await require("../services/notificationService").sendNotification({
      user_id: story.userId,
      title: 'Success Story Published!',
      message: 'Your success story has been approved and published on the platform.',
      type: 'story_published'
    });

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
