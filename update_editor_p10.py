import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Monitor Health and Archive buttons to the top right Action group
new_buttons = """
            <div className="flex items-center gap-4 border-r pr-4">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={resume.healthMonitoringEnabled || false} 
                  onChange={(e) => updateResume({ healthMonitoringEnabled: e.target.checked })} 
                />
                Monitor Health
              </label>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${resumeId}/archive`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  navigate('/resume');
                } catch (e) {
                  console.error(e);
                }
              }}>Archive</Button>
            </div>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
"""

if "Monitor Health" not in content:
    content = content.replace("<Button variant=\"outline\" onClick={handleSave} disabled={saving}>", new_buttons)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated ResumeEditor.tsx for Phase 10")
