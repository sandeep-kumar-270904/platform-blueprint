import os
import re

editor_path = "src/components/resume/ResumeEditor.tsx"
with open(editor_path, "r", encoding="utf-8") as f:
    content = f.read()

sponsored_fetch = """
  const [sponsoredTemplates, setSponsoredTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setSponsoredTemplates(data))
      .catch(console.error);
    }
  }, [token]);
"""

if "setSponsoredTemplates" not in content:
    content = content.replace("useEffect(() => {", sponsored_fetch + "\n  useEffect(() => {")

    sponsored_options = """                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      {sponsoredTemplates.map((t: any) => (
                        <SelectItem key={t._id} value={t.layoutCode}>
                          {t.name} <span className="text-xs text-muted-foreground ml-2">(Optimized for {t.sponsoredByCompany} ATS)</span>
                        </SelectItem>
                      ))}"""

    # We need to replace the SelectItem block in ResumeEditor.
    content = re.sub(
        r'<SelectItem value="modern">Modern</SelectItem>\s*<SelectItem value="classic">Classic</SelectItem>\s*<SelectItem value="minimal">Minimal</SelectItem>',
        sponsored_options,
        content
    )

    with open(editor_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated ResumeEditor.tsx for Sponsored Templates")
