import os

file_path = "backend/models/Resume.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "narrativeDraft: { type: String }" not in content:
    content = content.replace("healthCheckScore: { type: Number },", "healthCheckScore: { type: Number },\n  narrativeDraft: { type: String },")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated Resume.js")
