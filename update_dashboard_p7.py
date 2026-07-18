import os

file_path = "src/pages/ResumeDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "InterviewSimulator" not in content:
    content = content.replace("import { CertificationWallet } from \"@/components/resume/CertificationWallet\";", "import { CertificationWallet } from \"@/components/resume/CertificationWallet\";\nimport { InterviewSimulator } from \"@/components/resume/InterviewSimulator\";\nimport { SalaryNegotiator } from \"@/components/resume/SalaryNegotiator\";")
    content = content.replace("Star, ArrowLeft, Target", "Star, ArrowLeft, Target, Mic, DollarSign")

# Add state variables
if "interviewOpen" not in content:
    content = content.replace("const [tailoring, setTailoring] = useState(false);", "const [tailoring, setTailoring] = useState(false);\n  const [interviewOpen, setInterviewOpen] = useState(false);\n  const [negotiatorOpen, setNegotiatorOpen] = useState(false);\n  const [activeResumeId, setActiveResumeId] = useState<string>('');")

# Add buttons to Resume Card
btn_code = """<Button variant="ghost" size="icon" onClick={() => { setActiveResumeId(resume._id as string); setInterviewOpen(true); }} title="Mock Interview">
                                <Mic className="h-4 w-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { setActiveResumeId(resume._id as string); setNegotiatorOpen(true); }} title="Salary Negotiation">
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </Button>"""

content = content.replace("<Target className=\"h-4 w-4 text-primary\" />\n                              </Button>", "<Target className=\"h-4 w-4 text-primary\" />\n                              </Button>\n                              " + btn_code)

# Add components at the bottom
modals = """
            {activeResumeId && <InterviewSimulator open={interviewOpen} onOpenChange={setInterviewOpen} resumeId={activeResumeId} />}
            {activeResumeId && <SalaryNegotiator open={negotiatorOpen} onOpenChange={setNegotiatorOpen} resumeId={activeResumeId} />}
"""

content = content.replace("</Tabs>\n            <Dialog open={tailorOpen} onOpenChange={setTailorOpen}>", "</Tabs>\n" + modals + "\n            <Dialog open={tailorOpen} onOpenChange={setTailorOpen}>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Simulator and Negotiator to ResumeDashboard.tsx")
