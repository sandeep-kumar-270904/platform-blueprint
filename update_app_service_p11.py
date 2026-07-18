import os

app_service_path = "backend/services/applicationService.js"
with open(app_service_path, "r", encoding="utf-8") as f:
    app_service_content = f.read()

# Update updateApplicationStatus signature
if "rejectionFeedback" not in app_service_content:
    app_service_content = app_service_content.replace(
        "exports.updateApplicationStatus = async ({ applicationId, newStatus, changedBy, note, io }) => {",
        "exports.updateApplicationStatus = async ({ applicationId, newStatus, changedBy, note, rejectionFeedback, rejectionFeedbackNote, io }) => {"
    )
    
    app_service_content = app_service_content.replace(
        "application.status = newStatus;",
        "application.status = newStatus;\n  if (newStatus === 'rejected') {\n    if (rejectionFeedback) application.rejectionFeedback = rejectionFeedback;\n    if (rejectionFeedbackNote) application.rejectionFeedbackNote = rejectionFeedbackNote;\n  }"
    )
    
    with open(app_service_path, "w", encoding="utf-8") as f:
        f.write(app_service_content)
    print("Updated applicationService.js")

# Update routes
routes_path = "backend/routes/applications.js"
with open(routes_path, "r", encoding="utf-8") as f:
    routes_content = f.read()

if "rejectionFeedback" not in routes_content:
    routes_content = routes_content.replace(
        "const { newStatus, note } = req.body;",
        "const { newStatus, note, rejectionFeedback, rejectionFeedbackNote } = req.body;"
    )
    routes_content = routes_content.replace(
        "newStatus,\n      changedBy: req.user.id,\n      note,\n      io: req.io",
        "newStatus,\n      changedBy: req.user.id,\n      note,\n      rejectionFeedback,\n      rejectionFeedbackNote,\n      io: req.io"
    )
    
    insights_endpoint = """
// GET /api/applications/insights/rejections
router.get('/insights/rejections', authMiddleware, async (req, res) => {
  try {
    const rawInsights = await JobApplication.aggregate([
      { $match: { applicant: mongoose.Types.ObjectId(req.user.id), status: 'rejected', rejectionFeedback: { $ne: null } } },
      { $group: { _id: "$rejectionFeedback", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const insights = rawInsights.map(i => ({ feedback: i._id, count: i.count }));
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
"""
    routes_content = routes_content.replace(
        "const Job = require('../models/Job');",
        "const Job = require('../models/Job');\nconst mongoose = require('mongoose');"
    )
    
    routes_content = routes_content.replace(
        "module.exports = router;",
        insights_endpoint + "\nmodule.exports = router;"
    )
    with open(routes_path, "w", encoding="utf-8") as f:
        f.write(routes_content)
    print("Updated applications.js routes")

