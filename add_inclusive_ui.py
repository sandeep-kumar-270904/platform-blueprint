import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

inclusive_ui = """
          <div className="pt-8 mt-8 border-t border-muted-foreground/10">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Advanced Settings (Optional)</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 bg-muted/20 p-4 rounded-md border border-muted/50">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Inclusive Hiring Signals</p>
                  <p className="text-xs text-muted-foreground">
                    Strictly opt-in. You may add fields here (e.g., Veteran, Person with Disability) ONLY if you explicitly want them visible to recruiters. Leave blank otherwise.
                  </p>
                  <Input 
                    placeholder="E.g., Veteran Status (Leave empty if not applicable)" 
                    className="mt-2 text-sm"
                    value={resume.inclusiveHiringSignals ? resume.inclusiveHiringSignals.join(', ') : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const arr = val.split(',').map(s => s.trim()).filter(s => s);
                      updateResume({ inclusiveHiringSignals: arr });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
"""

# Place it below the Skills section in the editor pane
if "Inclusive Hiring Signals" not in content:
    content = content.replace("</ResumeSection>", "</ResumeSection>\n" + inclusive_ui, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Inclusive Hiring UI to ResumeEditor.tsx")
