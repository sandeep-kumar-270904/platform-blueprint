import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyDetail, useCompanyExperiences, useInterviewProgress, useToggleInterviewProgress, useSubmitExperience } from "@/hooks/useInterviewPrep";
import { Loader2, ArrowLeft, CheckCircle2, MessageSquare, Code, Building, PenTool, CheckCircle, XCircle, Clock, Briefcase, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ReferralNetworkTab } from "@/components/placement/ReferralNetworkTab";
import { OASimulationTab } from "@/components/placement/OASimulationTab";

const CompanyPrepDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: company, isLoading: companyLoading } = useCompanyDetail(id!);
  const { data: experiences, isLoading: expLoading } = useCompanyExperiences(id!);
  const { data: progress } = useInterviewProgress(id!);
  const { mutate: toggleProgress } = useToggleInterviewProgress();
  const { mutate: submitExp, isPending: submitting } = useSubmitExperience();

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expOutcome, setExpOutcome] = useState<'Offered'|'Rejected'|'Waitlisted'>('Offered');
  const [expRounds, setExpRounds] = useState([{ roundName: "", details: "" }]);

  const handleAddRound = () => setExpRounds([...expRounds, { roundName: "", details: "" }]);
  
  const handleRoundChange = (index: number, field: 'roundName' | 'details', value: string) => {
    const newRounds = [...expRounds];
    newRounds[index][field] = value;
    setExpRounds(newRounds);
  };

  const handleRemoveRound = (index: number) => {
    const newRounds = [...expRounds];
    newRounds.splice(index, 1);
    setExpRounds(newRounds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitExp({ 
      companyId: id!, 
      data: { title: expTitle, outcome: expOutcome, rounds: expRounds }
    }, {
      onSuccess: () => {
        setIsFormOpen(false);
        setExpTitle("");
        setExpRounds([{ roundName: "", details: "" }]);
        toast({ title: "Experience submitted successfully! It is now pending moderation." });
      },
      onError: (error: any) => toast({ 
        variant: "destructive", 
        title: "Failed to submit experience.",
        description: error?.response?.data?.msg || "Something went wrong."
      })
    });
  };

  const isReviewed = (type: 'tech'|'hr', qId: string) => {
    if (!progress) return false;
    return type === 'tech' ? progress.reviewed_tech.includes(qId) : progress.reviewed_hr.includes(qId);
  };

  const totalQuestions = (company?.technicalQuestions?.length || 0) + (company?.hrTips?.length || 0);
  
  // Safe calculation filtering out any invalid/deleted IDs by checking against current company questions
  const validTechReviewed = company?.technicalQuestions?.filter(q => progress?.reviewed_tech?.includes(q._id)).length || 0;
  const validHrReviewed = company?.hrTips?.filter(q => progress?.reviewed_hr?.includes(q._id)).length || 0;
  
  const totalReviewed = validTechReviewed + validHrReviewed;
  const progressPercent = totalQuestions > 0 ? Math.round((totalReviewed / totalQuestions) * 100) : 0;

  if (companyLoading) {
    return <div className="min-h-screen bg-background flex justify-center pt-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!company) {
    return <div className="min-h-screen bg-background flex justify-center pt-24">Company not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" className="mt-1" onClick={() => navigate('/placement/interview-prep')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-16 w-16 border bg-white mt-1">
              <AvatarImage src={company.logoUrl} className="object-contain p-2" />
              <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{company.name} Interview Guide</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{company.companyType}</Badge>
                <Badge variant="outline">{experiences?.length || 0} Experiences</Badge>
              </div>
            </div>
          </div>
          
          {/* Progress Card Mini */}
          <Card className="w-full md:w-64 shrink-0 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-xl font-bold text-primary">{totalReviewed}/{totalQuestions}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-right">questions reviewed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="tech" className="w-full">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50 h-auto p-1 flex-wrap">
              <TabsTrigger value="tech" className="py-2.5 px-4"><Code className="w-4 h-4 mr-2"/>Technical</TabsTrigger>
              <TabsTrigger value="hr" className="py-2.5 px-4"><MessageSquare className="w-4 h-4 mr-2"/>HR Tips</TabsTrigger>
              <TabsTrigger value="exp" className="py-2.5 px-4"><UsersIcon className="w-4 h-4 mr-2"/>Experiences</TabsTrigger>
              <TabsTrigger value="referrals" className="py-2.5 px-4"><Briefcase className="w-4 h-4 mr-2"/>Referral Network</TabsTrigger>
              <TabsTrigger value="oa" className="py-2.5 px-4"><Clock className="w-4 h-4 mr-2"/>OA Simulation</TabsTrigger>
              <TabsTrigger value="overview" className="py-2.5 px-4"><Building className="w-4 h-4 mr-2"/>Overview</TabsTrigger>
            </TabsList>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0"><PenTool className="w-4 h-4 mr-2"/> Share Experience</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Share Interview Experience at {company.name}</DialogTitle>
                  <DialogDescription>Help others by sharing the rounds and questions you faced.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role / Title</Label>
                      <Input placeholder="e.g. SDE-1 Interview Experience" value={expTitle} onChange={e=>setExpTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Outcome</Label>
                      <Select value={expOutcome} onValueChange={(v:any)=>setExpOutcome(v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Offered">Offered</SelectItem>
                          <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Interview Rounds</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddRound}>+ Add Round</Button>
                    </div>
                    {expRounds.map((round, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <Input placeholder="Round Name (e.g. Online Assessment)" value={round.roundName} onChange={e=>handleRoundChange(idx, 'roundName', e.target.value)} required className="max-w-sm"/>
                            {expRounds.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveRound(idx)}>Remove</Button>}
                          </div>
                          <Textarea placeholder="Details (questions asked, your approach...)" value={round.details} onChange={e=>handleRoundChange(idx, 'details', e.target.value)} required className="min-h-[100px]"/>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Experience'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="tech" className="mt-0">
            <Card>
              <CardHeader><h2 className="text-xl font-bold">Technical Questions</h2></CardHeader>
              <CardContent>
                {company.technicalQuestions?.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {company.technicalQuestions.map((q) => {
                      const checked = isReviewed('tech', q._id);
                      return (
                        <AccordionItem value={q._id} key={q._id} className="border-b last:border-0 px-2 group">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={checked} onCheckedChange={(c) => toggleProgress({ companyId: id!, type: 'tech', questionId: q._id, reviewed: c as boolean })} className="mt-1 self-start" />
                            <div className="flex-1">
                              <AccordionTrigger className={`hover:no-underline py-4 text-left ${checked ? 'text-muted-foreground line-through' : ''}`}>
                                <div>
                                  <span>{q.question}</span>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-[10px] font-normal">{q.difficulty}</Badge>
                                    <Badge variant="secondary" className="text-[10px] font-normal">{q.category}</Badge>
                                  </div>
                                </div>
                              </AccordionTrigger>
                            </div>
                          </div>
                          <AccordionContent className="pl-8 pb-4 text-muted-foreground whitespace-pre-line border-l-2 ml-4">
                            <strong>Approach:</strong><br/>
                            {q.approach}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground">No technical questions available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hr" className="mt-0">
            <Card>
              <CardHeader><h2 className="text-xl font-bold">HR & Behavioral Tips</h2></CardHeader>
              <CardContent>
                {company.hrTips?.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {company.hrTips.map((q) => {
                      const checked = isReviewed('hr', q._id);
                      return (
                        <AccordionItem value={q._id} key={q._id} className="border-b last:border-0 px-2 group">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={checked} onCheckedChange={(c) => toggleProgress({ companyId: id!, type: 'hr', questionId: q._id, reviewed: c as boolean })} className="mt-1 self-start" />
                            <div className="flex-1">
                              <AccordionTrigger className={`hover:no-underline py-4 text-left ${checked ? 'text-muted-foreground line-through' : ''}`}>
                                <div>
                                  <span>{q.question}</span>
                                  <Badge variant="secondary" className="text-[10px] font-normal block w-fit mt-2">{q.category}</Badge>
                                </div>
                              </AccordionTrigger>
                            </div>
                          </div>
                          <AccordionContent className="pl-8 pb-4 text-muted-foreground whitespace-pre-line border-l-2 ml-4">
                            <strong>Guidance:</strong><br/>
                            {q.guidance}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground">No HR tips available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exp" className="mt-0 space-y-4">
            {expLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground"/></div>
            ) : experiences?.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No experiences shared yet. Be the first!</CardContent></Card>
            ) : (
              experiences?.map((exp) => {
                const authorName = exp.author?.full_name || "Former Student";
                const avatarFallback = authorName.charAt(0);
                
                return (
                <Card key={exp._id} className="overflow-hidden">
                  <div className="bg-muted/30 px-6 py-4 border-b flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{exp.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Avatar className="h-5 w-5"><AvatarImage src={exp.author?.avatarUrl}/><AvatarFallback>{avatarFallback}</AvatarFallback></Avatar>
                        <span>{authorName}</span>
                        <span>•</span>
                        <span>{new Date(exp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      exp.outcome === 'Offered' ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20' : 
                      exp.outcome === 'Rejected' ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20' : 
                      'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
                    }>
                      {exp.outcome === 'Offered' && <CheckCircle className="w-3 h-3 mr-1"/>}
                      {exp.outcome === 'Rejected' && <XCircle className="w-3 h-3 mr-1"/>}
                      {exp.outcome === 'Waitlisted' && <Clock className="w-3 h-3 mr-1"/>}
                      {exp.outcome}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {exp.rounds.map((round, idx) => (
                        <div key={idx}>
                          <h4 className="font-semibold text-md mb-2 flex items-center">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">{idx+1}</span>
                            {round.roundName}
                          </h4>
                          <p className="text-muted-foreground text-sm whitespace-pre-line pl-8">{round.details}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <ReferralNetworkTab companyId={id!} />
          </TabsContent>

          <TabsContent value="oa" className="mt-0">
            <OASimulationTab companyId={id!} companyName={company.name} />
          </TabsContent>

          <TabsContent value="overview" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><h3 className="font-bold text-lg">Hiring Stages</h3></CardHeader>
                <CardContent>
                  <ul className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-border pl-8">
                    {company.overview?.hiringStages?.map((stage, idx) => (
                      <li key={idx} className="relative">
                        <span className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                        <p className="font-medium mb-1">{stage}</p>
                        
                        {idx === 0 && company.aptitudePattern?.hasAptitude && (
                          <div className="bg-primary/5 border border-primary/20 p-4 rounded-md mt-2 text-sm max-w-sm">
                            <h5 className="font-bold text-primary mb-2">Aptitude Test Pattern</h5>
                            <ul className="space-y-1 text-muted-foreground">
                              {company.aptitudePattern.quantQuestions > 0 && <li>Quantitative: {company.aptitudePattern.quantQuestions} Qs</li>}
                              {company.aptitudePattern.logicalQuestions > 0 && <li>Logical: {company.aptitudePattern.logicalQuestions} Qs</li>}
                              {company.aptitudePattern.verbalQuestions > 0 && <li>Verbal: {company.aptitudePattern.verbalQuestions} Qs</li>}
                              <li>Duration: {company.aptitudePattern.durationMinutes} minutes</li>
                            </ul>
                            {company.aptitudePattern.notes && (
                              <p className="mt-2 text-xs italic">{company.aptitudePattern.notes}</p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card>
                  <CardHeader><h3 className="font-bold text-lg">Eligibility Criteria</h3></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{company.overview?.eligibilityCriteria}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><h3 className="font-bold text-lg">Typical Roles</h3></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {company.overview?.typicalRoles?.map(role => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
};


export default CompanyPrepDetail;
