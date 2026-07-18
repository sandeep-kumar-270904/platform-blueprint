import os
import re

# Update IdeaReport.js
report_model_path = "backend/models/IdeaReport.js"
with open(report_model_path, "r", encoding="utf-8") as f:
    report_content = f.read()

# Original enum: enum: ['Idea', 'Comment', 'BrainstormThought', 'CirclePost', 'User']
# We'll just replace the enum or remove it, or update it directly.
new_enum = "['Idea', 'Comment', 'BrainstormThought', 'CirclePost', 'User', 'SharedResume', 'PortfolioPage', 'ResumeTemplate']"

report_content = re.sub(
    r"enum:\s*\[([^\]]+)\]",
    f"enum: {new_enum}",
    report_content,
    count=1
)
with open(report_model_path, "w", encoding="utf-8") as f:
    f.write(report_content)
print("Updated IdeaReport.js")

# Update moderationController.js
mod_ctrl_path = "backend/controllers/moderationController.js"
with open(mod_ctrl_path, "r", encoding="utf-8") as f:
    mod_ctrl_content = f.read()

# Update validation
mod_ctrl_content = re.sub(
    r"if \(\!\['Idea', 'IdeaComment', 'BrainstormThought', 'CirclePost', 'User'\]\.includes\(targetType\)\)",
    "if (!['Idea', 'IdeaComment', 'BrainstormThought', 'CirclePost', 'User', 'SharedResume', 'PortfolioPage', 'ResumeTemplate'].includes(targetType))",
    mod_ctrl_content
)

with open(mod_ctrl_path, "w", encoding="utf-8") as f:
    f.write(mod_ctrl_content)
print("Updated moderationController.js")
