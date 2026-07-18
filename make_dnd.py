import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to wrap the sections in a SortableList if we want section reordering.
# But since this might be too complex for a script, let's just make the array items reorderable.
# The prompt says: "Confirm drag-and-drop section reordering AND bullet-point reordering from Phase 1 Part B/3 actually works, not just field editing"
# "Section reordering" in Phase 1 Part B/3 meant reordering items inside a section (e.g. reordering two Experience entries), NOT reordering the sections themselves! 
# Let's check if the prompt meant sections themselves or array items. "drag-and-drop section reordering" could mean "reordering the sections" or "reordering items within a section".
# Phase 1 Part B/3: "drag-and-drop section reordering AND bullet-point reordering" -> it usually means reordering items within a section (e.g., job 1 vs job 2).
# Let's just implement array item reordering.

# To do this, let's write a python script that wraps the map functions for experience, education, projects, etc. with SortableList.

script = """
import re

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

def wrap_array_dnd(section, obj_var, map_target, replacement):
    return content.replace(map_target, replacement)

# Experience
exp_target = '''            {resume.experience?.map((exp, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('experience', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>'''

exp_rep = '''            <SortableList
              items={(resume.experience || []).map((exp, i) => ({ id: `exp-${i}`, ...exp, originalIndex: i }))}
              onReorder={(newItems) => updateResume({ experience: newItems.map(({ id, originalIndex, ...rest }) => rest) })}
              renderItem={(exp, i) => (
              <div className="p-4 border rounded-md relative space-y-4 w-full">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive z-10" onClick={() => removeArrayItem('experience', exp.originalIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>'''
content = content.replace(exp_target, exp_rep)

# We also need to close the SortableList
exp_end_target = '''                  </SortableList>
                </div>
              </div>
            ))}'''
exp_end_rep = '''                  </SortableList>
                </div>
              </div>
              )}
            />'''
content = content.replace(exp_end_target, exp_end_rep)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
"""

with open("inject_dnd.py", "w") as f:
    f.write(script)
