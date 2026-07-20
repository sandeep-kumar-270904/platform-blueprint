import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, FileText, CheckCircle2, Mail, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Scholarship } from "@/hooks/useScholarships";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EssayBank } from "@/components/scholarships/EssayBank";
import { RecommendationManager } from "@/components/resume/RecommendationManager";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScholarshipApply = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fastTrackOptIn, setFastTrackOptIn] = useState(false);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [essayResponses, setEssayResponses] = useState<Record<string, string>>({});
  const [documentUploads, setDocumentUploads] = useState<Record<string, string>>({});
  const [attachedResumeId, setAttachedResumeId] = useState<string | null>(null);
  const [attachedLetterId, setAttachedLetterId] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  
  const [recommendationLetters, setRecommendationLetters] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/scholarships/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.applicationMode === 'external_link') {
              navigate(`/scholarships/${id}`);
              return;
          }
          setScholarship(data);
        }

        const initRes = await fetch(`${API_URL}/api/scholarships/${id}/apply`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        let draftAppId = null;
        if (initRes.ok) {
           const draft = await initRes.json();
           draftAppId = draft._id;
           setAppId(draftAppId);
        }

        const promises = [
          fetch(`${API_URL}/api/resumes`, { headers: { 'Authorization': `Bearer ${token}` } })
        ];

        if (draftAppId) {
          promises.push(
            fetch(`${API_URL}/api/scholarships/applications/${draftAppId}/available-letters`, { headers: { 'Authorization': `Bearer ${token}` } })
          );
        } else {
          // Fallback if initiation failed for some reason
          promises.push(
            fetch(`${API_URL}/api/recommendation-letters/my-requests`, { headers: { 'Authorization': `Bearer ${token}` } })
          );
        }

        const [resRes, recRes] = await Promise.all(promises);

        if (recRes.ok) {
            const data = await recRes.json();
            // /available-letters returns already filtered list, /my-requests returns all. Filter just in case.
            setRecommendationLetters(data.filter((l: any) => l.status === 'submitted' || l.status === 'published'));
        }
        if (resRes.ok) {
            const data = await resRes.json();
            setResumes(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!scholarship) return;
    setSubmitting(true);
    
    const finalResponses = Object.entries(responses).map(([k, v]) => ({ fieldKey: k, value: v }));
    const formattedEssays = Object.entries(essayResponses).map(([k, v]) => ({ fieldKey: k, response: v, content: v }));

    try {
      const token = localStorage.getItem('token');

      if (!appId) {
          toast.error("Application draft not initialized.");
          setSubmitting(false);
          return;
      }

      // Update draft responses
      const draftRes = await fetch(`${API_URL}/api/scholarships/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            responses: finalResponses,
            essayResponses: formattedEssays
        })
      });
      if (!draftRes.ok) throw new Error('Failed to update draft');

      if (attachedResumeId) {
        await fetch(`${API_URL}/api/scholarships/applications/${appId}/resume`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeId: attachedResumeId })
        });
      }

      if (attachedLetterId) {
        await fetch(`${API_URL}/api/scholarships/applications/${appId}/letter`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendationLetterId: attachedLetterId })
        });
      }

      // Upload mock docs
      for (const fieldKey of Object.keys(documentUploads)) {
        await fetch(`${API_URL}/api/scholarships/applications/${appId}/document`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldKey }) // In reality would be FormData
        });
      }

      // Final submit
      const submitRes = await fetch(`${API_URL}/api/scholarships/applications/${appId}/submit`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
      });

      if (submitRes.ok) {
          setSuccess(true);
          toast.success("Application submitted successfully!");
      } else {
          const errData = await submitRes.json();
          toast.error(errData.message || "Failed to submit application");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!scholarship) return <div className="text-center p-24">Scholarship not found</div>;

  if (success) {
      return (
          <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-24 flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                    Your application for <strong>{scholarship.title}</strong> has been successfully received. We will notify you when there's an update.
                </p>
                <Button onClick={() => navigate('/scholarships')} size="lg">Back to Scholarships</Button>
            </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(`/scholarships/${id}`)} className="mb-6 -ml-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to details
        </Button>

        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Apply for {scholarship.title}</h1>
            <p className="text-muted-foreground">
                {scholarship.isEmergencyAid 
                    ? "Emergency Aid applications are fast-tracked. Please provide a brief explanation of your circumstances." 
                    : "Please fill out all required fields below to submit your application."}
            </p>
        </div>

        <div className="space-y-8">
            {scholarship.isEmergencyAid ? (
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Emergency Aid Fast-Track
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Statement of Need (Required)</Label>
                            <Textarea 
                                placeholder="Briefly explain your emergency situation..."
                                value={essayResponses['statement'] || ''}
                                onChange={(e) => setEssayResponses({ ...essayResponses, 'statement': e.target.value })}
                                className="min-h-[150px]"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-4">
                            <Checkbox 
                                id="fastTrack" 
                                checked={fastTrackOptIn} 
                                onCheckedChange={(c) => setFastTrackOptIn(!!c)} 
                            />
                            <Label htmlFor="fastTrack">Opt-in to share these details with immediate university relief programs.</Label>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Standard Profile verification (Mock representation) */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={user?.name || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ''} disabled />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">To update this information, please visit your account settings.</p>
                </CardContent>
            </Card>

            {/* Dynamic fields if present */}
            {scholarship.inAppRequirements && scholarship.inAppRequirements.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {scholarship.inAppRequirements.map((req: any, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <Label>{req.label} {req.required && <span className="text-destructive">*</span>}</Label>
                                    {req.fieldType === 'essay' && (
                                        <EssayBank 
                                            currentPrompt={req.essayPromptText || req.label} 
                                            targetScholarshipId={id}
                                            targetPromptFieldKey={req.fieldKey}
                                            onSelectEssay={(text) => setEssayResponses(prev => ({...prev, [req.fieldKey]: text}))} 
                                        />
                                    )}
                                </div>
                                {req.fieldType === 'essay' && req.essayPromptText && (
                                    <p className="text-sm text-muted-foreground italic mb-2">{req.essayPromptText}</p>
                                )}
                                {(req.fieldType === 'textarea' || req.fieldType === 'essay') ? (
                                    <Textarea 
                                        value={req.fieldType === 'essay' ? (essayResponses[req.fieldKey] || '') : (responses[req.fieldKey] || '')}
                                        onChange={e => {
                                            if (req.fieldType === 'essay') {
                                                setEssayResponses(prev => ({...prev, [req.fieldKey]: e.target.value}));
                                            } else {
                                                setResponses(prev => ({...prev, [req.fieldKey]: e.target.value}));
                                            }
                                        }}
                                        className="min-h-[150px]"
                                        placeholder="Write your response here..."
                                    />
                                ) : req.fieldType === 'recommendation_letter' ? (
                                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/20">
                                          <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                          <h3 className="font-semibold mb-1">Recommendation Letter</h3>
                                          <p className="text-sm text-muted-foreground mb-4">Select a completed letter or request a new one.</p>
                                          
                                          <div className="flex flex-col items-center gap-4">
                                            <Select 
                                                value={attachedLetterId || ''}
                                                onValueChange={v => setAttachedLetterId(v)}
                                            >
                                                <SelectTrigger className="w-full max-w-md mx-auto">
                                                    <SelectValue placeholder="Select a recommendation letter" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {recommendationLetters.length === 0 ? (
                                                        <SelectItem value="none" disabled>No letters available</SelectItem>
                                                    ) : (
                                                        recommendationLetters.map(l => (
                                                            <SelectItem key={l._id} value={l._id}>
                                                                Letter from {l.writtenBy?.name || l.externalEmail} ({l.relationship})
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            {attachedLetterId && (
                                                <div className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-md flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" /> This letter will be securely attached as a permanent snapshot when you submit.
                                                </div>
                                            )}

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">Request a New Letter</Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Manage Recommendation Letters</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <RecommendationManager />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                          </div>
                                        <div className="mt-4 text-xs text-muted-foreground">
                                            Need a new one? <a href="/resume-builder/feedback" className="text-primary hover:underline">Request via Resume Builder</a>
                                        </div>
                                    </div>
                                ) : req.fieldType === 'resume_select' ? (
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/20">
                                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                        <h3 className="font-semibold mb-1">Attach from Resume Builder</h3>
                                        <Select 
                                            value={attachedResumeId || ''}
                                            onValueChange={v => setAttachedResumeId(v)}
                                        >
                                            <SelectTrigger className="w-full max-w-md mx-auto">
                                                <SelectValue placeholder="Select a resume" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resumes.length === 0 ? (
                                                    <SelectItem value="none" disabled>No resumes available</SelectItem>
                                                ) : (
                                                    resumes.map(r => (
                                                        <SelectItem key={r._id} value={r._id}>
                                                            {r.name || 'Untitled Resume'}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : req.fieldType === 'file_upload' ? (
                                     <div className="flex flex-col gap-2">
                                         <Input 
                                            type="file" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setDocumentUploads(prev => ({ ...prev, [req.fieldKey]: e.target.files![0].name }));
                                                }
                                            }} 
                                         />
                                         {documentUploads[req.fieldKey] && <p className="text-sm text-green-600">File selected: {documentUploads[req.fieldKey]}</p>}
                                     </div>
                                ) : (
                                    <Input 
                                        type="text"
                                        value={responses[req.fieldKey] || ''}
                                        onChange={e => setResponses(prev => ({...prev, [req.fieldKey]: e.target.value}))}
                                    />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
            </>
            )}

            {/* Employer Fast-Track Integration (Phase 4) */}
            {scholarship.linkedJobId && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Briefcase className="h-5 w-5" />
                            Employer Sponsored Program
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="fast-track" 
                                checked={fastTrackOptIn}
                                onCheckedChange={(checked) => setFastTrackOptIn(checked as boolean)}
                            />
                            <div className="space-y-1 leading-none">
                                <Label htmlFor="fast-track" className="font-semibold text-base">
                                    Opt-in to fast-track my job application
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    By checking this box, if you are awarded this scholarship, you will automatically be fast-tracked to the short-list stage for the linked job position.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end gap-4 border-t border-border pt-6">
                <Button variant="outline" onClick={() => navigate(`/scholarships/${id}`)}>Cancel</Button>
                <Button variant="secondary" onClick={() => toast.success("Draft saved!")}>Save Draft</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Application
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipApply;
