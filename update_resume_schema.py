import os

file_path = "backend/models/Resume.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Phase 8 fields to Resume Schema
phase_8_fields = """
  // Phase 8: Accessibility, Gamification, Multilingual, Discovery
  inclusiveHiringSignals: { type: [String], default: [] }, // Strictly opt-in e.g., ['Veteran', 'Disability']
  isDiscoveryResume: { type: Boolean, default: false }, // Explicitly surface this resume in recruiter discovery feed
  discoveryViews: { type: Number, default: 0 },
  language: { type: String, default: 'en' },
  translatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  translationStatus: { type: String, enum: ['ai_translated', 'reviewed', 'manual'] },
  gamificationBadges: { type: [String], default: [] },
"""

if "inclusiveHiringSignals" not in content:
    content = content.replace("coverLetterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CoverLetter' }]", "coverLetterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CoverLetter' }],\n" + phase_8_fields)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Resume.js with Phase 8 fields")
