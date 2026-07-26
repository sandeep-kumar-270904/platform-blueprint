import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, Plus, Copy, Trash2, ArrowLeft, Target, Mic, DollarSign,
  Briefcase, Award, MessageSquare, Users, LineChart, ShieldAlert,
  LayoutDashboard, PlayCircle, Star
} from "lucide-react";
import { useResumes } from "@/hooks/useResume";
import { ResumeAnalytics } from "@/components/resume/ResumeAnalytics";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CoverLetterList } from "@/components/resume/CoverLetterList";
import { CertificationWallet } from "@/components/resume/CertificationWallet";
import { InterviewSimulator } from "@/components/resume/InterviewSimulator";
import { SalaryNegotiator } from "@/components/resume/SalaryNegotiator";
import { useNavigate } from "react-router-dom";

const ResumeDashboard = () => {
  const { resumes, loading, createResume, deleteResume, duplicateResume, setDefaultResume } = useResumes();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('resumes');
  const [tailorOpen, setTailorOpen] = useState(false);
  const [tailorResumeId, setTailorResumeId] = useState<string|null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [negotiatorOpen, setNegotiatorOpen] = useState(false);
  const [activeResumeId, setActiveResumeId] = useState<string>('');

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

  const handleCreateNew = async () => {
    try {
      const newResume = await createResume({
        title: 'New Resume',
        targetRole: '',
        personalInfo: { fullName: '', email: '', phone: '', location: '' }
      });
      if (newResume) navigate(`/resume-builder/editor/${newResume._id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const sidebarLinks = [
    { id: 'resumes', label: 'My Resumes', icon: FileText, route: null },
    { id: 'cover-letters', label: 'Cover Letters', icon: MessageSquare, route: null },
    { id: 'wallet', label: 'Certifications', icon: Award, route: null },
    { id: 'campaigns', label: 'Job Campaigns', icon: Target, route: '/resume-builder/campaigns' },
    { id: 'feedback', label: 'Feedback Threads', icon: Star, route: '/resume-builder/feedback' },
    { id: 'benchmarking', label: 'Peer Benchmarking', icon: Users, route: '/resume-builder/benchmarking' },
    { id: 'portfolios', label: 'Portfolio Editor', icon: LayoutDashboard, route: '/resume-builder/portfolio' },
    { id: 'insights', label: 'Career Insights', icon: LineChart, route: '/resume-builder/insights' },
    { id: 'workshops', label: 'Live Workshops', icon: PlayCircle, route: '/resume/workshops' },
    { id: 'panic', label: 'Panic Mode Rebuild', icon: ShieldAlert, route: null },
  ];

  const renderContent = () => {
    if (activeTab === 'cover-letters') {
      return <CoverLetterList />;
    }
    if (activeTab === 'wallet') {
      return <CertificationWallet />;
    }
    
    // Default to resumes
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Resumes</h2>
          <Button onClick={handleCreateNew}><Plus className="h-4 w-4 mr-2" /> Create Resume</Button>
        </div>

        {loading ? (
          <p>Loading resumes...</p>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No Resumes Yet</CardTitle>
              <CardDescription className="mb-6">Create your first resume to get started on your career journey.</CardDescription>
              <Button onClick={handleCreateNew}>Create Resume</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map(resume => (
              <Card key={resume._id} className={`flex flex-col relative ${resume.isDefault ? 'border-primary' : ''}`}>
                {resume.isDefault && (
                  <Badge className="absolute -top-3 -right-3">Default</Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-1">{resume.title}</CardTitle>
                  <CardDescription>
                    {resume.targetRole || 'No target role'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4 mb-6 text-sm">
                    <p className="text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ATS Score</span>
                      <Badge variant={resume.atsScore?.score > 70 ? 'default' : 'secondary'}>
                        {resume.showAtsScore ? resume.atsScore?.score || 'N/A' : 'Hidden'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-auto">
                    <Button className="w-full" onClick={() => navigate(`/resume-builder/editor/${resume._id}`)}>
                      Edit Resume
                    </Button>
                    <div className="flex justify-between gap-1 mt-2">
                      <Button variant="ghost" size="sm" onClick={() => setDefaultResume(resume._id as string)} disabled={resume.isDefault}>
                        Set Default
                      </Button>
                      <div className="flex">
                        <ResumeAnalytics analytics={resume.analytics} />
                        <Button variant="ghost" size="icon" onClick={() => duplicateResume(resume._id as string)} title="Duplicate">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setTailorResumeId(resume._id as string); setTailorOpen(true); }} title="Tailor for Job">
                          <Target className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setActiveResumeId(resume._id as string); setInterviewOpen(true); }} title="Mock Interview">
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setActiveResumeId(resume._id as string); setNegotiatorOpen(true); }} title="Salary Negotiation">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteResume(resume._id as string)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex max-w-7xl mx-auto pt-20 px-4 gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="sticky top-24 space-y-1">
            <h3 className="font-semibold px-4 mb-4 text-sm uppercase tracking-wider text-muted-foreground">Builder Suite</h3>
            {sidebarLinks.map(link => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.route) {
                      navigate(link.route);
                    } else {
                      setActiveTab(link.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                    activeTab === link.id && !link.route
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-12">
          {renderContent()}
        </main>
      </div>

      <Dialog open={tailorOpen} onOpenChange={setTailorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tailor Resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Our AI will duplicate this resume and suggest targeted rewrites for your bullet points to better match the job requirements.
            </p>
            <Textarea 
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              rows={6}
            />
            <Button className="w-full" onClick={handleTailor} disabled={tailoring || !jobDescription}>
              {tailoring ? 'Tailoring...' : 'Generate Tailored Resume'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InterviewSimulator 
        open={interviewOpen} 
        onOpenChange={setInterviewOpen} 
        resumeId={activeResumeId} 
      />

      <SalaryNegotiator 
        open={negotiatorOpen} 
        onOpenChange={setNegotiatorOpen} 
        resumeId={activeResumeId} 
      />
    </div>
  );
};

export default ResumeDashboard;
