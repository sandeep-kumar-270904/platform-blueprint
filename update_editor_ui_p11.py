import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Narrative Draft State
if "const [narrativeDraft, setNarrativeDraft] = useState(resume.narrativeDraft || '');" not in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState('basics');",
        "const [activeTab, setActiveTab] = useState('basics');\n  const [narrativeDraft, setNarrativeDraft] = useState(resume.narrativeDraft || '');\n  const [generatingNarrative, setGeneratingNarrative] = useState(false);"
    )

# Add Narrative Tab
tabs = """
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
"""
content = content.replace("<TabsTrigger value=\"skills\">Skills</TabsTrigger>", tabs)

# Narrative generation function
narrative_func = """
  const handleGenerateNarrative = async () => {
    setGeneratingNarrative(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${resumeId}/narrative`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNarrativeDraft(data.narrativeDraft);
        toast.success("Narrative generated!");
      }
    } catch (e) {
      toast.error("Failed to generate narrative");
    } finally {
      setGeneratingNarrative(false);
    }
  };
"""
if "handleGenerateNarrative" not in content:
    content = content.replace("const handleSave = async () => {", narrative_func + "\n  const handleSave = async () => {")

# Narrative Tab Content
narrative_content = """
        <TabsContent value="narrative" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Narrative Resume</h2>
              <p className="text-sm text-muted-foreground">An AI-generated prose version of your resume, perfect for your portfolio's About section.</p>
            </div>
            <Button onClick={handleGenerateNarrative} disabled={generatingNarrative}>
              {generatingNarrative ? "Generating..." : "Generate Narrative"}
            </Button>
          </div>
          <Textarea 
            value={narrativeDraft}
            onChange={(e) => setNarrativeDraft(e.target.value)}
            placeholder="Your story goes here..."
            className="min-h-[300px]"
          />
        </TabsContent>
"""
if "value=\"narrative\"" not in content:
    content = content.replace("</Tabs>", narrative_content + "\n      </Tabs>")

# Update Save function to include narrativeDraft
content = content.replace("updateResume({ ...resumeData, id: resumeId })", "updateResume({ ...resumeData, id: resumeId, narrativeDraft })")

# Inject Institution Branding and Guidelines
branding_logic = """
  useEffect(() => {
    if (user?.institutionId?.branding?.primaryColor) {
      document.documentElement.style.setProperty('--primary', user.institutionId.branding.primaryColor);
    }
    return () => {
      document.documentElement.style.removeProperty('--primary');
    };
  }, [user]);
"""
if "user?.institutionId?.branding" not in content:
    content = content.replace("useEffect(() => {", branding_logic + "\n  useEffect(() => {")

logo_ui = """
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/resume')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Edit Resume
              </h1>
              {user?.institutionId?.branding?.logoUrl && (
                <img src={user.institutionId.branding.logoUrl} alt="Institution Logo" className="h-6 ml-2" />
              )}
            </div>
"""
content = content.replace("""          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/resume')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Edit Resume
            </h1>
          </div>""", logo_ui)

checklist_ui = """
      {user?.institutionId?.resumeGuidelines && user.institutionId.resumeGuidelines.length > 0 && (
        <Card className="mt-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Institutional Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {user.institutionId.resumeGuidelines.map((guideline: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border border-primary mt-0.5" />
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
"""
content = content.replace("<AIAssistant resume={resume} />", "<AIAssistant resume={resume} />" + checklist_ui)

# Update Skills logic for Verification
verify_skill = """
  const verifySkill = async (skill: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/check-skill?skill=${encodeURIComponent(skill)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.exists) {
        toast("Quiz available! Redirecting to verification...", { action: { label: "Go", onClick: () => navigate(`/quizzes/${data.quizId}`) } });
      } else {
        toast("No verification quiz available for this skill yet.");
      }
    } catch (e) {
      toast.error("Failed to check skill");
    }
  };
"""
if "const verifySkill" not in content:
    content = content.replace("const addSkill = () => {", verify_skill + "\n  const addSkill = () => {")

skill_ui = """
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      value={skill} 
                      onChange={e => handleArrayChange('skills', index, e.target.value)}
                    />
                    <Button variant="outline" size="sm" onClick={() => verifySkill(skill)}>Verify</Button>
                    <Button variant="ghost" size="icon" onClick={() => removeArrayItem('skills', index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
"""
if "verifySkill(skill)" not in content:
    import re
    # We need to replace the mapping of skills in the Skills tab.
    # It looks like: <Input \n value={skill} \n onChange={e => handleArrayChange('skills', index, e.target.value)}\n />
    # We can just inject the Verify button.
    content = re.sub(r'(<Input\s*value=\{skill\}\s*onChange=\{e => handleArrayChange\(\'skills\', index, e\.target\.value\)\}\s*/>)', r'\1\n                    <Button variant="outline" size="sm" onClick={() => verifySkill(skill)}>Verify</Button>', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ResumeEditor.tsx")
