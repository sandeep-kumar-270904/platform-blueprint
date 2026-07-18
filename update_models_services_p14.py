import os
import re

# 1. Update ResumeTemplate.js
template_path = "backend/models/ResumeTemplate.js"
with open(template_path, "r", encoding="utf-8") as f:
    content = f.read()

if "usageCount: { type: Number, default: 0 }" not in content:
    content = content.replace(
        "isApproved: { type: Boolean, default: false } // Admin approval",
        "isApproved: { type: Boolean, default: false }, // Admin approval\n  rejectionReason: { type: String },\n  usageCount: { type: Number, default: 0 }"
    )
    with open(template_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated ResumeTemplate.js")

# 2. Update importService.js
import_path = "backend/services/importService.js"
if os.path.exists(import_path):
    with open(import_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "confidenceFlags" not in content:
        content = content.replace(
            "Return ONLY a JSON object matching this schema",
            "Return ONLY a JSON object matching this schema. Additionally, include a `confidenceFlags` object (e.g. { summary: 'low', experience: 'high', education: 'high', skills: 'medium' }) indicating how confident you are in your OCR/extraction for each major section. If the file looks like a scanned image or an old/fragmented format, accurately flag ambiguous fields as 'low'."
        )
        with open(import_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated importService.js")
else:
    print("importService.js not found, skipping or will create it.")

