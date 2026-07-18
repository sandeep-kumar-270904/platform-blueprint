import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Plus, Copy, Trash2, Star, ArrowLeft } from "lucide-react";
import { useResumes } from "@/hooks/useResume";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { ResumeAnalytics } from "@/components/resume/ResumeAnalytics";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoverLetterList } from "@/components/resume/CoverLetterList";

const ResumeBuilder = () => {
  const { resumes, loading, createResume, deleteResume, duplicateResume, setDefaultResume } = useResumes();
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-6 md:py-10">
          <div className="container mx-auto px-4 relative z-8">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-5xl text-center">
                <Badge variant="accent" className="mb-4">
                  <FileText className="mr-1 h-3 w-3" />
                  ATS-Friendly Resumes
                </Badge>
                <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                  Build Your <span className="text-primary display-font">Perfect Resume</span>
                </h1>
                <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
                  Create multiple professional, ATS-optimized resumes. Export to PDF and get AI-powered feedback.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8">
        {activeResumeId ? (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setActiveResumeId(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Resumes
            </Button>
            <ResumeEditor resumeId={activeResumeId} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <ResumeAnalytics />
              
              <div className="flex gap-2">
                <input 
                  type="file" 
                  id="resume-upload" 
                  className="hidden" 
                  accept=".pdf,.txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // We need a function in useResume to handle the import.
                    // Let's add it via the useResumes hook later, or fetch directly here.
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/import/file`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                      });
                      if (res.ok) {
                        const { resumeData } = await res.json();
                        const newResume = await createResume(resumeData);
                        if (newResume) setActiveResumeId(newResume._id);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
                <Button size="lg" variant="outline" className="gap-2" onClick={() => document.getElementById('resume-upload')?.click()}>
                  <FileText className="h-5 w-5" />
                  Import Resume
                </Button>

                <Button size="lg" className="gap-2" onClick={async () => {
                  const newResume = await createResume();
                  if (newResume) setActiveResumeId(newResume._id);
                }}>
                  <Plus className="h-5 w-5" />
                  Create New Resume
                </Button>
              </div>
            </div>

            <Tabs defaultValue="resumes" className="w-full">
              <TabsList className="mb-6 w-full max-w-md mx-auto grid grid-cols-2">
                <TabsTrigger value="resumes">Resumes</TabsTrigger>
                <TabsTrigger value="cover-letters">Cover Letters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resumes" className="mt-0">
                {loading ? (
                  <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">No resumes yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first resume to get started</p>
                    <Button onClick={() => createResume()}>Create Resume</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map(resume => (
                      <Card key={resume._id} className={`hover:border-primary transition-colors ${resume.isDefault ? 'border-primary shadow-sm' : ''}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {resume.title}
                                {resume.isDefault && <Star className="h-4 w-4 fill-primary text-primary" />}
                              </CardTitle>
                              <CardDescription>
                                Updated {resume.updated_at ? formatDistanceToNow(new Date(resume.updated_at), { addSuffix: true }) : 'recently'}
                              </CardDescription>
                            </div>
                            <Badge variant={resume.atsScore?.score >= 80 ? 'default' : 'secondary'}>
                              {resume.atsScore?.score || 0} ATS
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button className="w-full" onClick={() => setActiveResumeId(resume._id as string)}>
                            Edit Resume
                          </Button>
                          <div className="flex justify-between">
                            <Button variant="ghost" size="sm" onClick={() => setDefaultResume(resume._id as string)} disabled={resume.isDefault}>
                              Set Default
                            </Button>
                            <div className="flex gap-2">
                              <ResumeAnalytics analytics={resume.analytics} />
                              <Button variant="ghost" size="icon" onClick={() => duplicateResume(resume._id as string)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteResume(resume._id as string)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cover-letters" className="mt-0">
                <CoverLetterList />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;
