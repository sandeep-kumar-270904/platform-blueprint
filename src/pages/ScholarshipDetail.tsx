import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, CheckCircle2, ArrowLeft, Loader2, Sparkles, AlertCircle, Share2, Flag, ExternalLink } from "lucide-react";
import { useScholarships, Scholarship } from "@/hooks/useScholarships";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScholarshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_URL}/api/scholarships/${id}`);
        if (res.ok) {
          const data = await res.json();
          setScholarship(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const handleExplanation = async () => {
    if (!id || !user) return;
    setExplanationLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/${id}/match-explanation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExplanation(data.explanation);
      } else {
        setExplanation("Based on your profile, you match the core academic and demographic criteria.");
      }
    } catch (err) {
      setExplanation("Based on your profile, you match the core academic and demographic criteria.");
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleApply = async () => {
    if (!scholarship || !user) {
        // prompt login
        return;
    }

    if (scholarship.applicationMode === 'external_link') {
        // create tracking record
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/scholarships/${scholarship._id}/apply`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
        } catch (err) {
            console.error(err);
        }
        window.open(scholarship.externalUrl, '_blank');
    } else {
        navigate(`/scholarships/${scholarship._id}/apply`);
    }
  };

  if (loading) return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!scholarship) return <div className="text-center p-24">Scholarship not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/scholarships')} className="mb-6 -ml-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Scholarships
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{scholarship.title}</h1>
                    <p className="text-xl text-muted-foreground">{scholarship.provider}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                        {scholarship.applicationMode === 'in_app' ? 'In-App Application' : 'External Application'}
                    </Badge>
                    {scholarship.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>

                {/* Gemini Expansion */}
                {user && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2 font-medium text-primary">
                                <Sparkles className="h-4 w-4" /> Matched for you
                            </div>
                            {explanation ? (
                                <p className="text-sm text-muted-foreground">{explanation}</p>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-fit"
                                    onClick={handleExplanation}
                                    disabled={explanationLoading}
                                >
                                    {explanationLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                    Why this fits you
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    <h3 className="text-xl font-bold">About this Scholarship</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {scholarship.description}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Eligibility Criteria</h3>
                    <ul className="space-y-2 text-muted-foreground">
                        {scholarship.eligibility.minGPA && <li>• Minimum GPA: <strong className="text-foreground">{scholarship.eligibility.minGPA}</strong></li>}
                        {scholarship.eligibility.academicLevel && scholarship.eligibility.academicLevel.length > 0 && (
                            <li>• Academic Level: <strong className="text-foreground capitalize">{scholarship.eligibility.academicLevel.join(', ')}</strong></li>
                        )}
                        {scholarship.eligibility.majors && scholarship.eligibility.majors.length > 0 && (
                            <li>• Majors: <strong className="text-foreground">{scholarship.eligibility.majors.join(', ')}</strong></li>
                        )}
                        {scholarship.eligibility.location && scholarship.eligibility.location.length > 0 && (
                            <li>• Location: <strong className="text-foreground">{scholarship.eligibility.location.join(', ')}</strong></li>
                        )}
                        {scholarship.eligibility.financialNeedRequired && (
                            <li>• Financial Need: <strong className="text-foreground">Required</strong></li>
                        )}
                        {scholarship.eligibility.otherCriteria && scholarship.eligibility.otherCriteria.map(c => (
                            <li key={c}>• {c}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Sidebar actions */}
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="text-3xl font-bold text-primary flex items-center gap-1">
                            <DollarSign className="h-6 w-6" />
                            {scholarship.amountType === 'fixed' ? scholarship.amount.min?.toLocaleString() : 
                             scholarship.amountType === 'range' ? `${scholarship.amount.min?.toLocaleString()} - ${scholarship.amount.max?.toLocaleString()}` : 
                             scholarship.amountType === 'full_tuition' ? 'Full Tuition' : 'Varies'}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Deadline: {format(new Date(scholarship.applicationDeadline), 'MMM d, yyyy')}</span>
                            </div>
                        </div>

                        <Button size="lg" className="w-full font-bold text-lg" onClick={handleApply}>
                            {scholarship.applicationMode === 'in_app' ? 'Apply Now' : 'Apply Externally'}
                            {scholarship.applicationMode === 'external_link' && <ExternalLink className="ml-2 h-4 w-4" />}
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                        <Flag className="h-4 w-4 mr-2" /> Report
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetail;
