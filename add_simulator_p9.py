import os

file_path = "src/pages/CareerInsightsPage.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "CareerSimulator" not in content:
    content = content.replace("import { ResumeCompleteness }", "import { CareerSimulator } from \"../components/resume/CareerSimulator\";\nimport { ResumeCompleteness }")
    content = content.replace("</div>\n    </div>", "</div>\n      <CareerSimulator resumeId={resumeId as string} />\n    </div>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added CareerSimulator to CareerInsightsPage")
