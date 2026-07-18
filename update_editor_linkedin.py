import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "LinkedInExportModal" not in content:
    content = content.replace("import { TailorReview } from \"./TailorReview\";", "import { TailorReview } from \"./TailorReview\";\nimport { LinkedInExportModal } from \"./LinkedInExportModal\";")
    content = content.replace("import { Download, Save, Share2", "import { Download, Save, Share2, Linkedin")

# Add state
if "linkedinOpen" not in content:
    content = content.replace("const [saveSuccess, setSaveSuccess] = useState(false);", "const [saveSuccess, setSaveSuccess] = useState(false);\n  const [linkedinOpen, setLinkedinOpen] = useState(false);")

# Add button in toolbar
btn_code = """<Button variant="outline" size="sm" onClick={() => setLinkedinOpen(true)}>
            <Linkedin className="h-4 w-4 mr-2" />
            Export to LinkedIn
          </Button>"""

content = content.replace("<Share2 className=\"h-4 w-4 mr-2\" />\n            Share\n          </Button>", "<Share2 className=\"h-4 w-4 mr-2\" />\n            Share\n          </Button>\n          " + btn_code)

# Add Modal
modal_code = """<LinkedInExportModal open={linkedinOpen} onOpenChange={setLinkedinOpen} resumeId={resumeId as string} />"""
content = content.replace("</ResumeProvider>", modal_code + "\n    </ResumeProvider>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added LinkedIn Export to ResumeEditor.tsx")
