const Testimonial = require('../models/Testimonial');
const Resume = require('../models/Resume');
const crypto = require('crypto');

exports.requestTestimonial = async (req, res) => {
  try {
    const { resumeId,
      resumeSnapshot: resume.toObject(), clientEmail, projectContext } = req.body;
    
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const token = crypto.randomBytes(20).toString('hex');
    
    const testimonial = new Testimonial({
      resumeId,
      resumeSnapshot: resume.toObject(),
      freelancerId: req.user.id,
      clientEmail,
      projectContext,
      requestToken: token,
      status: 'requested'
    });

    await testimonial.save();
    
    // In a real app, send email with token link: `/public/testimonial/${token}`
    res.status(201).json({ message: 'Request sent', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTestimonialByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const testimonial = await Testimonial.findOne({ requestToken: token });
    if (!testimonial) return res.status(404).json({ message: 'Invalid or expired token' });
    
    // Don't expose sensitive info, just the context needed for the public form
    res.json({
      projectContext: testimonial.projectContext,
      status: testimonial.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitTestimonialPublic = async (req, res) => {
  try {
    const { token } = req.params;
    const { clientName, quote } = req.body;
    
    const testimonial = await Testimonial.findOne({ requestToken: token });
    if (!testimonial) return res.status(404).json({ message: 'Invalid token' });
    if (testimonial.status !== 'requested') return res.status(400).json({ message: 'Already submitted' });

    testimonial.clientName = clientName;
    testimonial.quote = quote;
    testimonial.status = 'submitted';
    // Remove token so it can't be resubmitted easily
    testimonial.requestToken = null;
    
    await testimonial.save();
    res.json({ message: 'Testimonial submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFreelancerTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ freelancerId: req.user.id });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reviewTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) return res.status(404).json({ message: 'Not found' });
    if (testimonial.freelancerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    if (action === 'approve') {
      testimonial.status = 'approved';
      // Add to resume
      const resume = await Resume.findById(testimonial.resumeId);
      if (resume) {
        resume.clientTestimonials.push({
          clientName: testimonial.clientName,
          quote: testimonial.quote,
          projectContext: testimonial.projectContext
        });
        await resume.save();
      }
    } else {
      testimonial.status = 'rejected';
    }
    
    await testimonial.save();
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
