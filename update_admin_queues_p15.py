import os
import re

# 1. Update CertificationRecord.js
cert_model_path = "backend/models/CertificationRecord.js"
with open(cert_model_path, "r", encoding="utf-8") as f:
    cert_content = f.read()

if "rejectionReason" not in cert_content:
    cert_content = cert_content.replace(
        "evidenceUrl: { type: String }, // File or link",
        "evidenceUrl: { type: String }, // File or link\n  rejectionReason: { type: String }, // Admin feedback if rejected"
    )
    with open(cert_model_path, "w", encoding="utf-8") as f:
        f.write(cert_content)
    print("Updated CertificationRecord.js")

# 2. Update certificationController.js
cert_ctrl_path = "backend/controllers/certificationController.js"
with open(cert_ctrl_path, "r", encoding="utf-8") as f:
    cert_ctrl = f.read()

if "AdminActionLog" not in cert_ctrl:
    cert_ctrl = cert_ctrl.replace(
        "const Notification = require('../models/Notification');",
        "const Notification = require('../models/Notification');\nconst AdminActionLog = require('../models/AdminActionLog');"
    )

    # In verifyCertification:
    # const { status } = req.body;
    # cert.verificationStatus = status;
    verify_logic_old = """    const { status } = req.body; // 'platform_verified' or 'unverified'
    const cert = await CertificationRecord.findById(id);
    if (!cert) return res.status(404).json({ message: 'Not found' });
    
    cert.verificationStatus = status;
    await cert.save();"""

    verify_logic_new = """    const { status, rejectionReason } = req.body; // 'platform_verified' or 'unverified'
    const cert = await CertificationRecord.findById(id);
    if (!cert) return res.status(404).json({ message: 'Not found' });
    
    cert.verificationStatus = status;
    if (rejectionReason) cert.rejectionReason = rejectionReason;
    
    await cert.save();
    
    await AdminActionLog.create({
      adminId: req.user.id,
      actionType: status === 'platform_verified' ? 'approve_certification' : 'reject_certification',
      targetId: cert._id,
      reason: rejectionReason || 'Admin reviewed certification'
    });"""
    cert_ctrl = cert_ctrl.replace(verify_logic_old, verify_logic_new)

    with open(cert_ctrl_path, "w", encoding="utf-8") as f:
        f.write(cert_ctrl)
    print("Updated certificationController.js")


# 3. Update templates.js
templates_path = "backend/routes/templates.js"
with open(templates_path, "r", encoding="utf-8") as f:
    templates_content = f.read()

if "AdminActionLog" not in templates_content:
    templates_content = templates_content.replace(
        "const authMiddleware = require('../middleware/auth');",
        "const authMiddleware = require('../middleware/auth');\nconst AdminActionLog = require('../models/AdminActionLog');"
    )

    pending_endpoint = """
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
"""
    if "admin/pending" not in templates_content:
        templates_content = templates_content.replace(
            "// GET /api/templates",
            pending_endpoint + "\n// GET /api/templates"
        )
    
    # Update approve endpoint
    approve_old = """    template.isApproved = true;
    await template.save();"""
    approve_new = """    template.isApproved = true;
    template.rejectionReason = null; // Clear if previously rejected
    await template.save();
    await AdminActionLog.create({
      adminId: req.user.id,
      actionType: 'approve_template',
      targetId: template._id,
      reason: 'Admin approved community/sponsored template'
    });"""
    templates_content = templates_content.replace(approve_old, approve_new)

    # Update reject endpoint
    reject_old = """const { reason } = req.body;
    const template = await ResumeTemplate.findByIdAndUpdate(req.params.id, { isApproved: false, rejectionReason: reason }, { new: true });"""
    reject_new = """const { reason } = req.body;
    const template = await ResumeTemplate.findByIdAndUpdate(req.params.id, { isApproved: false, rejectionReason: reason }, { new: true });
    await AdminActionLog.create({
      adminId: req.user.id,
      actionType: 'reject_template',
      targetId: template._id,
      reason: reason || 'Admin rejected template'
    });"""
    templates_content = templates_content.replace(reject_old, reject_new)

    with open(templates_path, "w", encoding="utf-8") as f:
        f.write(templates_content)
    print("Updated templates.js")

