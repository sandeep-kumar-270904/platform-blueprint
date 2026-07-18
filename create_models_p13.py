import os

# 1. JobSearchCampaign.js
campaign_model = """const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true }, // e.g. "Summer 2027 Internship Search"
  targetRoles: [{ type: String }],
  startDate: { type: Date, default: Date.now },
  targetEndDate: { type: Date },
  linkedResumeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }],
  linkedCoverLetterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CoverLetter' }],
  linkedApplicationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication' }],
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('JobSearchCampaign', campaignSchema);
"""

with open("backend/models/JobSearchCampaign.js", "w", encoding="utf-8") as f:
    f.write(campaign_model)
print("Created JobSearchCampaign.js")


# 2. PeerGroup.js
peer_group_model = """const mongoose = require('mongoose');

const peerGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // small group 3-6
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCode: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('PeerGroup', peerGroupSchema);
"""

with open("backend/models/PeerGroup.js", "w", encoding="utf-8") as f:
    f.write(peer_group_model)
print("Created PeerGroup.js")


# 3. Update ResumeVersion.js
version_path = "backend/models/ResumeVersion.js"
with open(version_path, "r", encoding="utf-8") as f:
    version_content = f.read()

if "isTimeCapsule: { type: Boolean, default: false }" not in version_content:
    version_content = version_content.replace(
        "atsScoreAtVersion: { type: mongoose.Schema.Types.Mixed },",
        "atsScoreAtVersion: { type: mongoose.Schema.Types.Mixed },\n  isTimeCapsule: { type: Boolean, default: false },\n  capsuleNote: { type: String },\n  unlockDate: { type: Date },"
    )
    with open(version_path, "w", encoding="utf-8") as f:
        f.write(version_content)
    print("Updated ResumeVersion.js")
