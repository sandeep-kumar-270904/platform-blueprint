import os

file_path = "backend/models/Resume.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

phase_10_fields = """
  // Phase 10: Monitoring & Archiving
  isArchived: { type: Boolean, default: false },
  healthMonitoringEnabled: { type: Boolean, default: false },
  lastHealthCheck: { type: Date },
  healthCheckScore: { type: Number },
  attendedWorkshopAt: { type: Date }, // Internal tracking to tag edits within 48h
"""

if "isArchived: { type: Boolean" not in content:
    content = content.replace("availability: { type: String, enum: ['open', 'booked', 'not_available'], default: 'open' },", "availability: { type: String, enum: ['open', 'booked', 'not_available'], default: 'open' },\n" + phase_10_fields)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Resume.js with Phase 10 fields")
