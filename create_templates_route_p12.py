import os

templates_route = """const express = require('express');
const router = express.Router();
const ResumeTemplate = require('../models/ResumeTemplate');
const authMiddleware = require('../middleware/auth');

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
    await template.save();
    res.json({ message: 'Template approved', template });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
"""

with open("backend/routes/templates.js", "w", encoding="utf-8") as f:
    f.write(templates_route)
print("Created templates.js")

server_path = "backend/server.js"
with open(server_path, "r", encoding="utf-8") as f:
    server_content = f.read()

if "app.use('/api/templates', require('./routes/templates'));" not in server_content:
    server_content = server_content.replace(
        "app.use('/api/resumes', require('./routes/resumes'));",
        "app.use('/api/resumes', require('./routes/resumes'));\napp.use('/api/templates', require('./routes/templates'));"
    )
    with open(server_path, "w", encoding="utf-8") as f:
        f.write(server_content)
    print("Updated server.js to use templates routes")
