import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Import TailorReview
content = content.replace("import { SortableList } from \"./SortableList\";", "import { SortableList } from \"./SortableList\";\nimport { TailorReview } from \"./TailorReview\";")

# Add TailorReview UI at the top of the Editor Column
content = content.replace("{/* Editor Column */}\n      <div className=\"lg:col-span-2 space-y-6\">", "{/* Editor Column */}\n      <div className=\"lg:col-span-2 space-y-6\">\n        <TailorReview resume={resume} updateResume={updateResume} />")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added TailorReview to ResumeEditor.tsx")
