import os

file_path = "src/pages/ResumeDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Lucide icon Target
content = content.replace("Star, ArrowLeft", "Star, ArrowLeft, Target")
content = content.replace("Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from \"@/components/ui/dialog\";", "Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from \"@/components/ui/dialog\";")

# Add missing Dialog imports if they don't exist
if "import { Dialog" not in content:
    content = content.replace("import { Tabs", "import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from \"@/components/ui/dialog\";\nimport { Textarea } from \"@/components/ui/textarea\";\nimport { Label } from \"@/components/ui/label\";\nimport { Tabs")

# We need a state for tailor
if "const [tailorOpen, setTailorOpen] = useState(false);" not in content:
    content = content.replace("const navigate = useNavigate();", "const navigate = useNavigate();\n  const [tailorOpen, setTailorOpen] = useState(false);\n  const [tailorResumeId, setTailorResumeId] = useState<string|null>(null);\n  const [jobDescription, setJobDescription] = useState('');\n  const [tailoring, setTailoring] = useState(false);")

# We need a tailor function
tailor_func = """
  const handleTailor = async () => {
    if (!tailorResumeId || !jobDescription) return;
    setTailoring(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${tailorResumeId}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ jobDescription })
      });
      if (res.ok) {
        const tailored = await res.json();
        setTailorOpen(false);
        setJobDescription('');
        navigate(`/resume-builder/editor/${tailored._id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTailoring(false);
    }
  };
"""

content = content.replace("return (", tailor_func + "\n  return (")

# Add Tailor button
tailor_btn = """<Button variant="ghost" size="icon" onClick={() => { setTailorResumeId(resume._id as string); setTailorOpen(true); }} title="Tailor for Job">
                                <Target className="h-4 w-4 text-primary" />
                              </Button>"""

content = content.replace("<Copy className=\"h-4 w-4\" />\n                              </Button>", "<Copy className=\"h-4 w-4\" />\n                              </Button>\n                              " + tailor_btn)

# Add Dialog for tailoring at the end of the container
tailor_dialog = """
            <Dialog open={tailorOpen} onOpenChange={setTailorOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tailor Resume</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Job Description</Label>
                    <Textarea 
                      placeholder="Paste the job description here..." 
                      rows={6}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Our AI will duplicate this resume and suggest targeted rewrites for your bullet points to better match the job requirements.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTailorOpen(false)}>Cancel</Button>
                  <Button onClick={handleTailor} disabled={!jobDescription || tailoring}>
                    {tailoring ? 'Tailoring...' : 'Generate Tailored Resume'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
"""

content = content.replace("</Tabs>", "</Tabs>\n" + tailor_dialog)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ResumeDashboard.tsx with Tailor feature")
