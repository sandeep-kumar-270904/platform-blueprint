const express = require('express');
const router = express.Router();
const ResumeTemplate = require('../models/ResumeTemplate');
const authMiddleware = require('../middleware/auth');
const AdminActionLog = require('../models/AdminActionLog');


// GET /api/templates/admin/pending
router.get('/admin/pending', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const templates = await ResumeTemplate.find({ isApproved: false });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/templates
// Fetch approved templates
router.get('/', async (req, res) => {
  try {
    const templates = await ResumeTemplate.find({ isApproved: true });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/templates/sponsored
// Verified recruiters submit an ATS template
router.post('/sponsored', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can submit sponsored templates.' });
    }
    const { name, layoutCode, sponsoredByCompany } = req.body;
    
    const template = new ResumeTemplate({
      name,
      layoutCode,
      sponsoredByCompany,
      submittedBy: req.user.id,
      isApproved: false // Requires admin approval
    });
    await template.save();
    res.status(201).json({ message: 'Template submitted for admin approval.', template });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/templates/:id/approve
// Admin approve a template
router.patch('/:id/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const template = await ResumeTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    
    template.isApproved = true;
    template.rejectionReason = null; // Clear if previously rejected
    await template.save();
    await AdminActionLog.create({
      adminId: req.user.id,
      actionType: 'approve_template',
      targetId: template._id,
      reason: 'Admin approved community/sponsored template'
    });
    res.json({ message: 'Template approved', template });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// POST /api/templates/community
router.post('/community', auth, async (req, res) => {
  try {
    const { name, layoutCode } = req.body;
    const template = new ResumeTemplate({
      name,
      layoutCode,
      submittedBy: req.user.id,
      isApproved: false
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/templates/:id/reject
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const { reason } = req.body;
    const template = await ResumeTemplate.findByIdAndUpdate(req.params.id, { isApproved: false, rejectionReason: reason }, { new: true });
    await AdminActionLog.create({
      adminId: req.user.id,
      actionType: 'reject_template',
      targetId: template._id,
      reason: reason || 'Admin rejected template'
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/templates/:id/track-usage
router.post('/:id/track-usage', auth, async (req, res) => {
  try {
    const template = await ResumeTemplate.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } }, { new: true });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
