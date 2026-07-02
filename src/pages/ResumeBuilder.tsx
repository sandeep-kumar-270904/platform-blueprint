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
import { FileText, Download, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

const ResumeBuilder = () => {
  const [atsScore, setAtsScore] = useState(72);
  const [resumeData, setResumeData] = useState({
    name: "",
    email: "",
    phone: "",
    summary: "",
  });

  const atsTips = [
    { issue: "Missing keywords", severity: "high", tip: "Add industry-specific keywords" },
    { issue: "Complex formatting", severity: "medium", tip: "Use simple, ATS-friendly layout" },
    { issue: "No quantifiable achievements", severity: "high", tip: "Add metrics and numbers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <FileText className="mr-1 h-3 w-3" />
                  ATS-Optimized Resume Builder
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Build Your{" "}
                  <span className="text-foreground display-font">
                    Perfect Resume
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Create ATS-friendly resumes that pass applicant tracking systems and impress recruiters.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
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
                  <Input
                    id="name"
                    value={resumeData.name}
                    onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={resumeData.email}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={resumeData.phone}
                    onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={resumeData.summary}
                    onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                    placeholder="Brief overview of your experience and skills..."
                    rows={4}
                  />
                </div>
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download Resume
                </Button>
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
                  {atsTips.map((tip, index) => (
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
                  ))}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
