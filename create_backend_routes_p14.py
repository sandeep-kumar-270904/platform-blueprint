import os

# 1. Update recruiter.js (Add vitals computation to get specific application or all applications)
recruiter_path = "backend/routes/recruiter.js"
with open(recruiter_path, "r", encoding="utf-8") as f:
    content = f.read()

if "let yearsOfExperience = 0;" not in content:
    # We will just write a new file or patch the file to inject vitals computation
    pass

# For simplicity, since recruiter.js might be complex, let's create a snippet that adds `computeVitals`
# Actually, I'll just create the offers.js route first.

offers_route = """const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GeminiService = require('../services/geminiService');
const geminiService = new GeminiService();

// POST /api/offers/compare
router.post('/compare', auth, async (req, res) => {
  try {
    const { offers } = req.body;
    if (!offers || offers.length < 2) {
      return res.status(400).json({ message: 'At least 2 offers are required for comparison' });
    }

    const prompt = `You are a career advisor. A candidate is comparing the following job offers:\\n` +
      JSON.stringify(offers, null, 2) + 
      `\\n\\nAnalyze the gaps and differences between these offers (e.g. one has remote work, one doesn't; compensation differences). Generate 3-5 critical, specific questions the candidate should ask the employers before making a decision based ONLY on these differences. Do not give generic advice. Return a JSON array of strings.`;

    const model = geminiService.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const questions = JSON.parse(await result.response.text());
    res.json(questions);
  } catch (error) {
    console.error('Offer compare error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
"""

with open("backend/routes/offers.js", "w", encoding="utf-8") as f:
    f.write(offers_route)
print("Created offers.js")

# Add offers to server.js
server_path = "backend/server.js"
with open(server_path, "r", encoding="utf-8") as f:
    server_content = f.read()

if "app.use('/api/offers'" not in server_content:
    server_content = server_content.replace(
        "app.use('/api/recruiter', require('./routes/recruiter'));",
        "app.use('/api/recruiter', require('./routes/recruiter'));\napp.use('/api/offers', require('./routes/offers'));"
    )
    with open(server_path, "w", encoding="utf-8") as f:
        f.write(server_content)
    print("Added offers to server.js")

# Update templates.js
templates_path = "backend/routes/templates.js"
with open(templates_path, "r", encoding="utf-8") as f:
    t_content = f.read()

if "router.post('/community'" not in t_content:
    # Add community templates routes
    community_routes = """
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
"""
    t_content = t_content.replace("module.exports = router;", community_routes + "\nmodule.exports = router;")
    with open(templates_path, "w", encoding="utf-8") as f:
        f.write(t_content)
    print("Updated templates.js")
