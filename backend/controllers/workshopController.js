const ResumeWorkshop = require('../models/ResumeWorkshop');
const Resume = require('../models/Resume');

exports.listWorkshops = async (req, res) => {
  try {
    const workshops = await ResumeWorkshop.find().populate('hostId', 'name profilePicture');
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createWorkshop = async (req, res) => {
  try {
    // In a real app, verify req.user.role === 'admin' || 'mentor'
    const workshop = new ResumeWorkshop({
      ...req.body,
      hostId: req.user.id
    });
    await workshop.save();
    res.status(201).json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const workshop = await ResumeWorkshop.findById(id);
    if (!workshop) return res.status(404).json({ message: 'Not found' });
    
    if (!workshop.participantIds.includes(req.user.id)) {
      if (workshop.participantIds.length >= workshop.maxParticipants) {
        return res.status(400).json({ message: 'Workshop is full' });
      }
      workshop.participantIds.push(req.user.id);
      await workshop.save();
    }
    
    // Tag all user's resumes with attendedWorkshopAt to track 48-hr edits
    await Resume.updateMany(
      { user_id: req.user.id },
      { $set: { attendedWorkshopAt: new Date() } }
    );

    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.shareResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { resumeId } = req.body;
    
    const workshop = await ResumeWorkshop.findById(id);
    if (!workshop) return res.status(404).json({ message: 'Not found' });
    if (!workshop.participantIds.includes(req.user.id) && workshop.hostId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not participating' });
    }

    if (!workshop.sharedResumes.includes(resumeId)) {
      workshop.sharedResumes.push(resumeId);
      await workshop.save();
    }
    
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getWorkshopDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const workshop = await ResumeWorkshop.findById(id)
      .populate('hostId', 'name')
      .populate({
        path: 'sharedResumes',
        select: 'title summary skills experience education user_id',
        populate: { path: 'user_id', select: 'name' }
      });
    
    if (!workshop) return res.status(404).json({ message: 'Not found' });
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
