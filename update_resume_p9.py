import os

file_path = "backend/models/Resume.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Phase 9 fields
phase_9_fields = """
  // Phase 9: Freelance
  profileType: { type: String, enum: ['traditional', 'freelance'], default: 'traditional' },
  services: [{
    title: String,
    description: String,
    rateType: { type: String, enum: ['hourly', 'project', 'retainer'] },
    rateRange: String
  }],
  availability: { type: String, enum: ['open', 'booked', 'not_available'], default: 'open' },
  // clientTestimonials will just be references to the Testimonial model or embedded.
  // We'll embed approved ones for quick render, but manage them via Testimonial model.
  clientTestimonials: [{
    clientName: String,
    quote: String,
    projectContext: String
  }],
"""

if "profileType: { type: String" not in content:
    content = content.replace("gamificationBadges: { type: [String], default: [] },", "gamificationBadges: { type: [String], default: [] },\n" + phase_9_fields)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Resume.js with Phase 9 fields")
