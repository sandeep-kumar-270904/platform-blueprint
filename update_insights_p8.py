import os

file_path = "backend/controllers/resumeController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add discoveryViews aggregate to getInsights
discovery_logic = """
    // 7. Employer Discovery Views (Phase 8)
    const discoveryViews = resumes.reduce((acc, r) => acc + (r.discoveryViews || 0), 0);
"""

if "discoveryViews" not in content and "getInsights" in content:
    # Insert before tailoringEffectiveness
    content = content.replace("const tailoringEffectiveness = {", discovery_logic + "\n    const tailoringEffectiveness = {")
    content = content.replace("nextSteps,", "nextSteps,\n      discoveryViews,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resumeController.js insights with discoveryViews")
