import os

file_path = "backend/models/Resume.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "  template: { type: String, default: \"modern\" },"
replacement = """  template: { type: String, default: "modern" },

  // Phase 6: AI Tailoring
  tailoredForJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  tailorSuggestions: [{
    section: String,
    originalText: String,
    suggestedText: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  }],
"""

content = content.replace(target, replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Resume.js with tailoredForJobId and tailorSuggestions")
