import os

editor_path = "src/components/resume/ResumeEditor.tsx"
with open(editor_path, "r", encoding="utf-8") as f:
    content = f.read()

bundles_fetch = """
  const [credentialBundles, setCredentialBundles] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/skills/clusters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setCredentialBundles(data))
      .catch(console.error);
    }
  }, [token]);
"""

if "setCredentialBundles" not in content:
    content = content.replace("useEffect(() => {", bundles_fetch + "\n  useEffect(() => {")

    bundles_ui = """
      {credentialBundles.length > 0 && (
        <Card className="mt-6 border-green-200 dark:border-green-900/50">
          <CardHeader className="bg-green-50/50 dark:bg-green-900/10">
            <CardTitle className="text-lg text-green-800 dark:text-green-300">Unlocked Credential Bundles</CardTitle>
            <CardDescription>Based on your verified skills, you've unlocked macro-credentials.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex gap-2 flex-wrap">
            {credentialBundles.map((bundle: any, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full text-sm font-medium">
                <span>🏆</span>
                <span>{bundle.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
"""
    # Insert bundles UI in the Skills section
    content = content.replace("<TabsContent value=\"skills\" className=\"space-y-6\">", "<TabsContent value=\"skills\" className=\"space-y-6\">\n" + bundles_ui)

    with open(editor_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated ResumeEditor.tsx for Bundles")

# TemplateSelector update or just add Sponsored Templates logic in ResumeEditor directly if it's there.
# Let's check how template selection is handled. It's usually a select dropdown or TemplateSelector component.
# Let's see if TemplateSelector is in the file.
if "TemplateSelector" in content:
    print("TemplateSelector component found, but we will ignore it for now or modify TemplateSelector if needed.")
else:
    # Actually, they might be picking the template natively in ResumeEditor.
    pass
