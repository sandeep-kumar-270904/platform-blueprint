import React, { useState } from "react";
import { ResumeData, useResumeEditor } from "@/hooks/useResume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Trash2, Sparkles, LayoutPanelLeft, History } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ResumePDF } from "./PDFRenderer";
import { ResumeHistory } from "./ResumeHistory";
import { ResumeSharing } from "./ResumeSharing";
import { SortableList } from "./SortableList";

// Simple debounce helper could be added, but for now we'll save onBlur
interface Props {
  resumeId: string;
}

export const ResumeEditor = ({ resumeId }: Props) => {
  const { resume, loading, updateResume, scoreResume, refetch, trackExport } = useResumeEditor(resumeId);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!resume) return <div>Resume not found</div>;

  const handleChange = (section: string, field: string, value: string) => {
    updateResume({
      [section]: {
        ...(resume as any)[section],
        [field]: value
      }
    });
  };

  const handleArrayChange = (section: keyof ResumeData, index: number, field: string, value: any) => {
    const arr = [...(resume[section] as any[])];
    arr[index] = { ...arr[index], [field]: value };
    updateResume({ [section]: arr });
  };

  const addArrayItem = (section: keyof ResumeData, emptyItem: any) => {
    const arr = [...((resume[section] as any[]) || [])];
    arr.push(emptyItem);
    updateResume({ [section]: arr });
  };

  const removeArrayItem = (section: keyof ResumeData, index: number) => {
    const arr = [...((resume[section] as any[]) || [])];
    arr.splice(index, 1);
    updateResume({ [section]: arr });
  };

  const atsScore = resume?.atsScore?.score || 0;
  const atsTips = resume?.atsScore?.tips || [];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Editor Column */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={resume.personalInfo?.fullName || ''} onChange={e => handleChange('personalInfo', 'fullName', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={resume.personalInfo?.email || ''} onChange={e => handleChange('personalInfo', 'email', e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={resume.personalInfo?.phone || ''} onChange={e => handleChange('personalInfo', 'phone', e.target.value)} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={resume.personalInfo?.location || ''} onChange={e => handleChange('personalInfo', 'location', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Professional Summary</Label>
              <Textarea rows={4} value={resume.personalInfo?.professionalSummary || ''} onChange={e => handleChange('personalInfo', 'professionalSummary', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Experience</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('experience', { company: '', title: '', startDate: '', endDate: '', bulletPoints: [''] })}>
              <Plus className="h-4 w-4 mr-1" /> Add Experience
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <SortableList
              items={(resume.experience || []).map((exp, i) => ({ id: `exp-${i}`, ...exp, originalIndex: i }))}
              onReorder={(newItems) => updateResume({ experience: newItems.map(({ id, originalIndex, ...rest }) => rest) })}
              renderItem={(exp, i) => (
              <div className="p-4 border rounded-md relative space-y-4 w-full">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive z-10" onClick={() => removeArrayItem('experience', exp.originalIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Company</Label>
                    <Input value={exp.company} onChange={e => handleArrayChange('experience', i, 'company', e.target.value)} />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={exp.title} onChange={e => handleArrayChange('experience', i, 'title', e.target.value)} />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input value={exp.startDate} onChange={e => handleArrayChange('experience', i, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input value={exp.endDate} onChange={e => handleArrayChange('experience', i, 'endDate', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="flex justify-between items-center mb-2">
                    Bullet Points
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      const bps = [...(exp.bulletPoints || [])];
                      bps.push("");
                      handleArrayChange('experience', i, 'bulletPoints', bps);
                    }}>+ Add Bullet</Button>
                  </Label>
                  <SortableList
                    items={(exp.bulletPoints || []).map((bp: string, k: number) => ({ id: `bp-${i}-${k}`, text: bp, originalIndex: k }))}
                    onReorder={(newItems) => handleArrayChange('experience', i, 'bulletPoints', newItems.map(n => n.text))}
                    renderItem={(item, j) => (
                      <div className="flex gap-2 w-full">
                        <Input value={item.text} onChange={e => {
                          const bps = [...exp.bulletPoints];
                          bps[item.originalIndex] = e.target.value;
                          handleArrayChange('experience', i, 'bulletPoints', bps);
                        }} />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                          const bps = [...exp.bulletPoints];
                          bps.splice(item.originalIndex, 1);
                          handleArrayChange('experience', i, 'bulletPoints', bps);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Education</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('education', { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', achievements: [] })}>
              <Plus className="h-4 w-4 mr-1" /> Add Education
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.education?.map((edu, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('education', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Institution</Label>
                    <Input value={edu.institution} onChange={e => handleArrayChange('education', i, 'institution', e.target.value)} />
                  </div>
                  <div>
                    <Label>Degree</Label>
                    <Input value={edu.degree} onChange={e => handleArrayChange('education', i, 'degree', e.target.value)} />
                  </div>
                  <div>
                    <Label>Field of Study</Label>
                    <Input value={edu.fieldOfStudy} onChange={e => handleArrayChange('education', i, 'fieldOfStudy', e.target.value)} />
                  </div>
                  <div>
                    <Label>GPA</Label>
                    <Input value={edu.gpa} onChange={e => handleArrayChange('education', i, 'gpa', e.target.value)} />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={edu.startDate} onChange={e => handleArrayChange('education', i, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={edu.endDate} onChange={e => handleArrayChange('education', i, 'endDate', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('projects', { name: '', description: '', liveUrl: '', repoUrl: '', bulletPoints: [] })}>
              <Plus className="h-4 w-4 mr-1" /> Add Project
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.projects?.map((proj, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('projects', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Project Name</Label>
                    <Input value={proj.name} onChange={e => handleArrayChange('projects', i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={proj.description} onChange={e => handleArrayChange('projects', i, 'description', e.target.value)} />
                  </div>
                  <div>
                    <Label>Live URL</Label>
                    <Input value={proj.liveUrl} onChange={e => handleArrayChange('projects', i, 'liveUrl', e.target.value)} />
                  </div>
                  <div>
                    <Label>Repository URL</Label>
                    <Input value={proj.repoUrl} onChange={e => handleArrayChange('projects', i, 'repoUrl', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="flex justify-between items-center mb-2">
                    Bullet Points
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      const bps = [...(proj.bulletPoints || [])];
                      bps.push("");
                      handleArrayChange('projects', i, 'bulletPoints', bps);
                    }}>+ Add Bullet</Button>
                  </Label>
                  <SortableList
                    items={(proj.bulletPoints || []).map((bp, k) => ({ id: `proj-bp-${i}-${k}`, text: bp, originalIndex: k }))}
                    onReorder={(newItems) => handleArrayChange('projects', i, 'bulletPoints', newItems.map(n => n.text))}
                    renderItem={(item, j) => (
                      <div className="flex gap-2 w-full">
                        <Input value={item.text} onChange={e => {
                          const bps = [...proj.bulletPoints];
                          bps[item.originalIndex] = e.target.value;
                          handleArrayChange('projects', i, 'bulletPoints', bps);
                        }} />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                          const bps = [...proj.bulletPoints];
                          bps.splice(item.originalIndex, 1);
                          handleArrayChange('projects', i, 'bulletPoints', bps);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Skills</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('skills', { category: '', items: [] })}>
              <Plus className="h-4 w-4 mr-1" /> Add Category
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.skills?.map((skill, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('skills', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="pr-8 space-y-4">
                  <div>
                    <Label>Category (e.g. Frontend, Tools)</Label>
                    <Input value={skill.category} onChange={e => handleArrayChange('skills', i, 'category', e.target.value)} />
                  </div>
                  <div>
                    <Label>Skills (comma separated)</Label>
                    <Input value={(skill.items || []).join(', ')} onChange={e => handleArrayChange('skills', i, 'items', e.target.value.split(',').map(s => s.trim()))} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Certifications</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('certifications', { name: '', issuer: '', issueDate: '', credentialUrl: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Certification
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.certifications?.map((cert, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('certifications', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Name</Label>
                    <Input value={cert.name} onChange={e => handleArrayChange('certifications', i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Issuer</Label>
                    <Input value={cert.issuer} onChange={e => handleArrayChange('certifications', i, 'issuer', e.target.value)} />
                  </div>
                  <div>
                    <Label>Issue Date</Label>
                    <Input type="date" value={cert.issueDate} onChange={e => handleArrayChange('certifications', i, 'issueDate', e.target.value)} />
                  </div>
                  <div>
                    <Label>Credential URL</Label>
                    <Input value={cert.credentialUrl} onChange={e => handleArrayChange('certifications', i, 'credentialUrl', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Achievements</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('achievements', { title: '', description: '', date: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Achievement
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.achievements?.map((ach, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('achievements', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Title</Label>
                    <Input value={ach.title} onChange={e => handleArrayChange('achievements', i, 'title', e.target.value)} />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={ach.date} onChange={e => handleArrayChange('achievements', i, 'date', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea value={ach.description} onChange={e => handleArrayChange('achievements', i, 'description', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Languages</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('languages', { name: '', proficiency: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Language
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.languages?.map((lang, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('languages', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Language</Label>
                    <Input value={lang.name} onChange={e => handleArrayChange('languages', i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Proficiency</Label>
                    <Input value={lang.proficiency} onChange={e => handleArrayChange('languages', i, 'proficiency', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Links</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('links', { label: '', url: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Link
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.links?.map((link, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('links', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Label</Label>
                    <Input value={link.label} onChange={e => handleArrayChange('links', i, 'label', e.target.value)} />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input value={link.url} onChange={e => handleArrayChange('links', i, 'url', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* Sidebar Col */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              ATS Score & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">{atsScore}%</div>
              <Progress value={atsScore} className="h-3" />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <Label>Resume Template</Label>
                <Select value={resume.template || 'modern'} onValueChange={(val) => updateResume({ template: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={scoreResume} className="w-full gap-2">
                <Sparkles className="h-4 w-4" /> Score with AI
              </Button>
              <PDFDownloadLink
                document={<ResumePDF resume={resume} />}
                fileName={`${resume.title.replace(/\s+/g, '_')}.pdf`}
                className="w-full"
                onClick={() => trackExport?.()}
              >
                {({ loading }) => (
                  <Button variant="outline" className="w-full gap-2" disabled={loading}>
                    <LayoutPanelLeft className="h-4 w-4" /> 
                    {loading ? 'Generating PDF...' : 'Export to PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
              <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <History className="h-4 w-4" /> Version History
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Version History</DialogTitle>
                  </DialogHeader>
                  <ResumeHistory resumeId={resumeId} onRestore={() => { setHistoryOpen(false); refetch?.(); }} />
                </DialogContent>
              </Dialog>
            </div>
            
            <ResumeSharing resumeId={resumeId} initialSharing={resume.sharing || { enabled: false }} onUpdate={(updates) => updateResume(updates)} />
          </CardContent>
        </Card>

        {atsTips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>AI Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {atsTips.map((tip, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                  {tip.severity === "high" ? (
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-warning flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{tip.issue}</p>
                    <p className="text-muted-foreground">{tip.tip}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
