import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, CheckCircle2, AlertCircle, Sparkles, Save, Loader2 } from "lucide-react";

import { useResume, ResumeData } from "@/hooks/useResume";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { resume, loading, saveResume } = useResume(user?.id);
  const [resumeData, setResumeData] = useState<Partial<ResumeData>>({
    name: "",
    email: "",
    phone: "",
    summary: "",
  });

  useEffect(() => {
    if (resume) {
      setResumeData({
        name: resume.name || "",
        email: resume.email || "",
        phone: resume.phone || "",
        summary: resume.summary || ""
      });
    }
  }, [resume]);

  const handleSave = () => {
    saveResume(resumeData);
  };

  const atsScore = resume?.ats_score || 0;
  const atsTips = resume?.ats_tips || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-6 md:py-10">
          <div className="container mx-auto px-4 relative z-10">
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
                  Create professional, ATS-optimized resumes in minutes. Export to PDF and get instant feedback.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Resume Editor */}
            <ScrollReveal delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Resume Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={resumeData.name} onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={resumeData.email} onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={resumeData.phone} onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea id="summary" value={resumeData.summary} onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })} placeholder="Brief overview of your experience and skills... Use numbers/metrics!" rows={4} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1 gap-2"><Save className="h-4 w-4" /> Save Profile</Button>
                    <Button variant="outline" className="flex-1 gap-2"><Download className="h-4 w-4" /> Export PDF</Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* ATS Score & Tips */}
            <div className="space-y-6">
              <ScrollReveal delay={0.2}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      ATS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary mb-2">{atsScore}%</div>
                        <Progress value={atsScore} className="h-3" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Your resume is {atsScore >= 80 ? "excellent" : atsScore >= 60 ? "good" : "needs improvement"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <Card>
                  <CardHeader>
                    <CardTitle>Improvement Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {atsTips.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Save your resume to generate tips.</p>
                    ) : (
                      atsTips.map((tip, index) => (
                        <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                          {tip.severity === "high" ? (
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-warning flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{tip.issue}</p>
                            <p className="text-xs text-muted-foreground">{tip.tip}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;
