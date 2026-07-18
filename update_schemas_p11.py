import os

def update_file(path, search_str, replace_str):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if search_str in content and replace_str not in content:
        content = content.replace(search_str, replace_str)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {path}")
    else:
        print(f"No changes made to {path} or already updated.")

# 1. Resume.js
update_file("backend/models/Resume.js", 
            "healthCheckScore: { type: Number },\n  attendedWorkshopAt: { type: Date }, // Internal tracking to tag edits within 48h",
            "healthCheckScore: { type: Number },\n  attendedWorkshopAt: { type: Date }, // Internal tracking to tag edits within 48h\n  // Phase 11: Narrative\n  narrativeDraft: { type: String },")

# 2. JobApplication.js
update_file("backend/models/JobApplication.js",
            "rejectionReason: { type: String }",
            "rejectionReason: { type: String },\n  rejectionFeedback: { type: String, enum: ['skills_gap', 'experience_level', 'culture_fit', 'other', null] },\n  rejectionFeedbackNote: { type: String }")

# 3. Institution.js
update_file("backend/models/Institution.js",
            "adminUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],",
            "adminUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],\n  branding: { logoUrl: String, primaryColor: String },\n  resumeGuidelines: [{ type: String }],")

# 4. User.js
# Need to add institutionId. We can insert it near role.
update_file("backend/models/User.js",
            "role: {\n    type: String,",
            "institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },\n  role: {\n    type: String,")

