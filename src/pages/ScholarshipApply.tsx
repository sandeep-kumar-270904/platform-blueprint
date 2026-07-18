import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, FileText, CheckCircle2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Scholarship } from "@/hooks/useScholarships";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScholarshipApply = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [essayResponses, setEssayResponses] = useState<Record<string, string>>({});
  const [recommendationLetters, setRecommendationLetters] = useState<any[]>([]);

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

        const recRes = await fetch(`${API_URL}/api/recommendation-letters/my-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (recRes.ok) {
            const data = await recRes.json();
            setRecommendationLetters(data.filter((l: any) => l.status === 'submitted'));
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
    
    // Extract recommendation letter if present
    let attachedRecommendationLetterId = null;
    const finalResponses: any[] = [];
    
    scholarship.inAppRequirements?.forEach((req: any) => {
        const key = req.fieldKey || req.prompt;
        if (req.type === 'recommendation_letter') {
            if (responses[key]) attachedRecommendationLetterId = responses[key];
        } else if (req.type !== 'textarea') {
            if (responses[key]) finalResponses.push({ fieldKey: key, value: responses[key] });
        }
    });

    const formattedEssays = Object.entries(essayResponses).map(([k, v]) => ({ prompt: k, response: v }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/${id}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            responses: finalResponses,
            essayResponses: formattedEssays,
            attachedRecommendationLetterId
        })
      });

      if (res.ok) {
          setSuccess(true);
          toast.success("Application submitted successfully!");
      } else {
          toast.error("Failed to submit application");
      }
    } catch (err) {
      toast.error("An error occurred");
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
            <p className="text-muted-foreground">Please fill out all required fields below to submit your application.</p>
        </div>

        <div className="space-y-8">
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
                                <Label>{req.prompt} {req.required && <span className="text-destructive">*</span>}</Label>
                                {req.type === 'textarea' ? (
                                    <Textarea 
                                        value={essayResponses[req.prompt] || ''}
                                        onChange={e => setEssayResponses(prev => ({...prev, [req.prompt]: e.target.value}))}
                                        className="min-h-[150px]"
                                        placeholder="Write your response here..."
                                    />
                                ) : req.type === 'recommendation_letter' ? (
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/20">
                                        <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                        <h3 className="font-semibold mb-1">Recommendation Letter Required</h3>
                                        <p className="text-sm text-muted-foreground mb-4">You can select a completed letter from your Resume Builder profile.</p>
                                        <Select 
                                            value={responses[req.fieldKey || req.prompt] || ''}
                                            onValueChange={v => setResponses(prev => ({...prev, [req.fieldKey || req.prompt]: v}))}
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
                                        <div className="mt-4 text-xs text-muted-foreground">
                                            Need a new one? <a href="/resume-builder/feedback" className="text-primary hover:underline">Request via Resume Builder</a>
                                        </div>
                                    </div>
                                ) : (
                                    <Input 
                                        type={req.type || 'text'}
                                        value={responses[req.fieldKey || req.prompt] || ''}
                                        onChange={e => setResponses(prev => ({...prev, [req.fieldKey || req.prompt]: e.target.value}))}
                                    />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Resume Integration */}
            <Card>
                <CardHeader>
                    <CardTitle>Resume Attachment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Attach from Resume Builder</h3>
                        <p className="text-sm text-muted-foreground mb-6">Select a resume you've built on StudentHub to attach to this application.</p>
                        <Button variant="outline">Select Resume</Button>
                    </div>
                </CardContent>
            </Card>

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
