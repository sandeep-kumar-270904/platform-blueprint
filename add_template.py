import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

import_statement = """import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
"""
content = content.replace('import { Input } from "@/components/ui/input";', import_statement + 'import { Input } from "@/components/ui/input";')

target_sidebar = """            <div className="flex flex-col gap-2">
              <Button onClick={scoreResume} className="w-full gap-2">
                <Sparkles className="h-4 w-4" /> Score with AI
              </Button>
              <PDFDownloadLink"""

replacement_sidebar = """            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <Label>Resume Template</Label>
                <Select value={resume.template || 'modern'} onValueChange={(val) => updateResume({ template: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={scoreResume} className="w-full gap-2">
                <Sparkles className="h-4 w-4" /> Score with AI
              </Button>
              <PDFDownloadLink"""

content = content.replace(target_sidebar, replacement_sidebar)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Template selector to ResumeEditor.tsx")
