const AwardeeStory = require('../models/AwardeeStory');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const checkRole = require('../middleware/auth');

// Note: Notification creation logic assumes a standard structure exists, e.g. createNotification()

exports.createStory = async (req, res) => {
  try {
    const { scholarshipId, applicationId, narrative, showRealName, submitNow } = req.body;
    
    // Hard server-side check
    const application = await ScholarshipApplication.findOne({
      _id: applicationId,
      userId: req.user.id,
      scholarshipId,
      status: 'awarded'
    });
    
    if (!application) {
      return res.status(403).json({ message: 'Invalid application. Must be awarded and owned by the requesting user.' });
    }

    const story = new AwardeeStory({
      userId: req.user.id,
      scholarshipId,
      applicationId,
      narrative,
      showRealName: showRealName || false,
      status: submitNow ? 'submitted' : 'draft'
    });

    await story.save();
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const { narrative, showRealName, status } = req.body;
    const story = await AwardeeStory.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (['approved', 'submitted'].includes(story.status)) {
      return res.status(403).json({ message: 'Cannot edit a submitted or approved story' });
    }

    if (narrative !== undefined) story.narrative = narrative;
    if (showRealName !== undefined) story.showRealName = showRealName;
    if (status === 'submitted') story.status = 'submitted'; // Only allow draft -> submitted

    await story.save();
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyStories = async (req, res) => {
  try {
    const stories = await AwardeeStory.find({ userId: req.user.id })
      .populate('scholarshipId', 'title')
      .sort({ updatedAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPendingStories = async (req, res) => {
  try {
    const stories = await AwardeeStory.find({ status: 'submitted' })
      .populate('scholarshipId', 'title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.approveStory = async (req, res) => {
  try {
    const story = await AwardeeStory.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });

    story.status = 'approved';
    story.reviewedBy = req.user.id;
    await story.save();
    
    // Notify logic would go here
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.rejectStory = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const story = await AwardeeStory.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });

    story.status = 'rejected';
    story.reviewedBy = req.user.id;
    story.reviewNotes = reason;
    await story.save();

    // Notify logic would go here
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
