const FeedbackRequest = require('../models/FeedbackRequest');
const ResumeComment = require('../models/ResumeComment');
const Notification = require('../models/Notification');
const Resume = require('../models/Resume');
// const MentorProfile = require('../models/MentorProfile'); // Might be needed for verify if they are a mentor

exports.requestFeedback = async (req, res) => {
  try {
    const { resumeId, requestedFrom } = req.body; // requestedFrom can be an ObjectId or "open"
    
    // Verify resume ownership
    const resume = await Resume.findById(resumeId);
    if (!resume || resume.user_id.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const feedbackReq = new FeedbackRequest({
      resumeId,
      resumeSnapshot: resume.toObject(),
      requestedBy: req.user.id,
      requestedFrom
    });

    await feedbackReq.save();

    if (requestedFrom !== 'open') {
      // Notify the specific mentor
      await Notification.create({
        user_id: requestedFrom,
        title: 'New Resume Feedback Request',
        message: 'A mentee has requested your feedback on their resume.',
        type: 'feedback_request',
        link: `/resume-builder/feedback/${feedbackReq._id}`
      });
    }

    res.json(feedbackReq);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFeedbackRequests = async (req, res) => {
  try {
    const { resumeId } = req.query;
    if (resumeId) {
      // Get for a specific resume (owner view)
      const resume = await Resume.findById(resumeId);
      if (!resume || resume.user_id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const requests = await FeedbackRequest.find({ resumeId }).populate('requestedFrom pickedUpBy', 'name email');
      return res.json(requests);
    }
    
    // Get requests directed to the logged in user
    const directedToMe = await FeedbackRequest.find({
      $or: [
        { requestedFrom: req.user.id },
        { pickedUpBy: req.user.id }
      ]
    }).populate('requestedBy resumeId');

    res.json(directedToMe);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getOpenFeedbackRequests = async (req, res) => {
  try {
    // Only verify they are a mentor? If needed.
    const requests = await FeedbackRequest.find({
      requestedFrom: 'open',
      status: 'pending'
    }).populate('requestedBy', 'name');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.pickupOpenRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const feedbackReq = await FeedbackRequest.findOne({ _id: id, requestedFrom: 'open', status: 'pending' });
    
    if (!feedbackReq) {
      return res.status(404).json({ message: 'Request not found or already picked up' });
    }

    feedbackReq.pickedUpBy = req.user.id;
    feedbackReq.status = 'in_progress';
    await feedbackReq.save();

    // Notify owner
    await Notification.create({
      user_id: feedbackReq.requestedBy,
      title: 'Feedback Request Picked Up',
      message: 'A mentor has picked up your open resume feedback request.',
      type: 'feedback_update',
      link: `/resume-builder/feedback/${feedbackReq._id}`
    });

    res.json(feedbackReq);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { feedbackRequestId, sectionAnchor, body } = req.body;
    const feedbackReq = await FeedbackRequest.findById(feedbackRequestId);
    
    if (!feedbackReq) return res.status(404).json({ message: 'Request not found' });
    
    // Check authorization: must be the owner, the requested mentor, or the picked up mentor
    const isOwner = feedbackReq.requestedBy.toString() === req.user.id;
    const isSpecificMentor = feedbackReq.requestedFrom.toString() === req.user.id;
    const isPickedUpMentor = feedbackReq.pickedUpBy?.toString() === req.user.id;

    if (!isOwner && !isSpecificMentor && !isPickedUpMentor) {
      return res.status(403).json({ message: 'Not authorized to comment on this request' });
    }

    const comment = new ResumeComment({
      feedbackRequestId,
      authorId: req.user.id,
      sectionAnchor,
      body
    });

    await comment.save();

    // Notify the other party
    const notifyId = isOwner ? 
      (feedbackReq.pickedUpBy || feedbackReq.requestedFrom) : 
      feedbackReq.requestedBy;

    if (notifyId && notifyId !== 'open') {
      await Notification.create({
        user_id: notifyId,
        title: 'New Resume Comment',
        message: 'A new comment was added to the resume feedback thread.',
        type: 'feedback_comment',
        link: `/resume-builder/feedback/${feedbackReq._id}`
      });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { feedbackRequestId } = req.params;
    const feedbackReq = await FeedbackRequest.findById(feedbackRequestId);
    if (!feedbackReq) return res.status(404).json({ message: 'Request not found' });

    // Authorization check
    const isOwner = feedbackReq.requestedBy.toString() === req.user.id;
    const isSpecificMentor = feedbackReq.requestedFrom.toString() === req.user.id;
    const isPickedUpMentor = feedbackReq.pickedUpBy?.toString() === req.user.id;

    if (!isOwner && !isSpecificMentor && !isPickedUpMentor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const comments = await ResumeComment.find({ feedbackRequestId }).populate('authorId', 'name');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resolveComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await ResumeComment.findById(id).populate('feedbackRequestId');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Only owner can resolve
    const feedbackReq = await FeedbackRequest.findById(comment.feedbackRequestId);
    if (feedbackReq.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only resume owner can resolve comments' });
    }

    comment.resolved = true;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
