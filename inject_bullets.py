import os
import re

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure SortableList is imported
if "SortableList" not in content:
    content = content.replace('import { ResumeSharing } from "./ResumeSharing";', 'import { ResumeSharing } from "./ResumeSharing";\nimport { SortableList } from "./SortableList";')

# We need to replace bullet points with SortableList
# For Experience:
exp_bullet_target = """                  {exp.bulletPoints?.map((bp: string, j: number) => (
                    <div key={j} className="flex gap-2 mb-2">
                      <Input value={bp} onChange={e => {
                        const bps = [...exp.bulletPoints];
                        bps[j] = e.target.value;
                        handleArrayChange('experience', i, 'bulletPoints', bps);
                      }} />
                      <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                        const bps = [...exp.bulletPoints];
                        bps.splice(j, 1);
                        handleArrayChange('experience', i, 'bulletPoints', bps);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}"""

exp_bullet_replacement = """                  <SortableList
                    items={(exp.bulletPoints || []).map((bp: string, k: number) => ({ id: `bp-${i}-${k}`, text: bp, originalIndex: k }))}
                    onReorder={(newItems) => handleArrayChange('experience', i, 'bulletPoints', newItems.map(n => n.text))}
                    renderItem={(item, j) => (
                      <div className="flex gap-2 w-full">
                        <Input value={item.text} onChange={e => {
                          const bps = [...exp.bulletPoints];
                          bps[item.originalIndex] = e.target.value;
                          handleArrayChange('experience', i, 'bulletPoints', bps);
                        }} />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                          const bps = [...exp.bulletPoints];
                          bps.splice(item.originalIndex, 1);
                          handleArrayChange('experience', i, 'bulletPoints', bps);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  />"""

content = content.replace(exp_bullet_target, exp_bullet_replacement)

# For Projects:
proj_bullet_target = """                  {proj.bulletPoints?.map((bp, j) => (
                    <div key={j} className="flex gap-2 mb-2">
                      <Input value={bp} onChange={e => {
                        const bps = [...proj.bulletPoints];
                        bps[j] = e.target.value;
                        handleArrayChange('projects', i, 'bulletPoints', bps);
                      }} />
                      <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                        const bps = [...proj.bulletPoints];
                        bps.splice(j, 1);
                        handleArrayChange('projects', i, 'bulletPoints', bps);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}"""

proj_bullet_replacement = """                  <SortableList
                    items={(proj.bulletPoints || []).map((bp, k) => ({ id: `proj-bp-${i}-${k}`, text: bp, originalIndex: k }))}
                    onReorder={(newItems) => handleArrayChange('projects', i, 'bulletPoints', newItems.map(n => n.text))}
                    renderItem={(item, j) => (
                      <div className="flex gap-2 w-full">
                        <Input value={item.text} onChange={e => {
                          const bps = [...proj.bulletPoints];
                          bps[item.originalIndex] = e.target.value;
                          handleArrayChange('projects', i, 'bulletPoints', bps);
                        }} />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                          const bps = [...proj.bulletPoints];
                          bps.splice(item.originalIndex, 1);
                          handleArrayChange('projects', i, 'bulletPoints', bps);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  />"""

content = content.replace(proj_bullet_target, proj_bullet_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated bullet points to use SortableList in ResumeEditor.tsx")
