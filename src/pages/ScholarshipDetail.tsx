import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign, GraduationCap, MapPin, Search, ChevronRight, Bookmark, ArrowRight, ShieldCheck, Clock, ExternalLink, CheckCircle2, Sparkles, AlertTriangle, Building, BookOpen, Activity, PlayCircle, Lock, Trophy, ArrowLeft, Loader2, Share2, Flag, Languages, Star } from 'lucide-react';
import { useScholarships, Scholarship } from "@/hooks/useScholarships";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ScholarshipReviews } from "@/components/scholarships/ScholarshipReviews";
import { SubmitAwardeeStory } from "@/components/scholarships/SubmitAwardeeStory";
import { ProviderTrustBadge } from '@/components/scholarships/ProviderTrustBadge';
import { CommunityTrustBadge } from '@/components/scholarships/CommunityTrustBadge';
import { EmployerFastTrackConsent } from "@/components/scholarships/EmployerFastTrackConsent";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScholarshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [matchedPaths, setMatchedPaths] = useState<any[]>([]);
  const [hasApplication, setHasApplication] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [trustStats, setTrustStats] = useState<{reviewCount: number, averageRating: number, confirmedAwards: number} | null>(null);
  const [awardeeStories, setAwardeeStories] = useState<any[]>([]);
  const [pastCycles, setPastCycles] = useState<any>(null);
  const [isAwarded, setIsAwarded] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<{title: string, description: string} | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handleReport = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/scholarships/${id}/report`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: reportReason })
          });
          if (res.ok) {
              toast.success("Scholarship reported for review.");
              setReportModalOpen(false);
              setReportReason("");
          }
      } catch (e) {
          toast.error("Failed to report.");
      }
  };

  const handleTranslate = async (lang: string) => {
    setTargetLanguage(lang);
    if (lang === 'en') {
      setTranslatedContent(null);
      return;
    }
    
    // Check if we already have it in scholarship.translations
    const existing = scholarship?.translations?.find((t: any) => t.language === lang);
    if (existing) {
      setTranslatedContent({ title: existing.title, description: existing.description });
      return;
    }
    
    setTranslating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/${id}/translate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ targetLanguage: lang })
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedContent({ title: data.title, description: data.description });
        if (scholarship) {
            scholarship.translations = scholarship.translations || [];
            scholarship.translations.push(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/scholarships/${id}`);
        if (res.ok) {
          const data = await res.json();
          setScholarship(data);
          if (data.provider) {
             const trustRes = await fetch(`${API_URL}/api/scholarships/provider-trust/${encodeURIComponent(data.provider)}`);
             if (trustRes.ok) {
                 setTrustStats(await trustRes.json());
             }
          }
          if (data.status === 'archived') {
            const pastRes = await fetch(`${API_URL}/api/scholarships/${id}/past-cycles`);
            if (pastRes.ok) setPastCycles(await pastRes.json());
          }
        }

        if (token) {
          const [pathsRes, appsRes, storiesRes] = await Promise.all([
            fetch(`${API_URL}/api/scholarships/${id}/matched-paths`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/api/scholarships/applications`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/api/scholarships/${id}/awardee-stories`)
          ]);

          if (pathsRes.ok) setMatchedPaths(await pathsRes.json());
          
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            const myApp = appsData.applications?.find((a: any) => a.scholarshipId?._id === id || a.scholarshipId === id);
            if (myApp) {
               setApplication(myApp);
               if (myApp.status === 'awarded') setIsAwarded(true);
               if (myApp.status !== 'draft') setHasApplication(true);
            }
          }

          if (storiesRes.ok) setAwardeeStories(await storiesRes.json());
        } else {
          const storiesRes = await fetch(`${API_URL}/api/scholarships/${id}/awardee-stories`);
          if (storiesRes.ok) setAwardeeStories(await storiesRes.json());
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
    if (!scholarship || !user) return;
    if (scholarship.applicationMode === 'external_link') {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/scholarships/${scholarship._id}/track-external-click`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok && !application) {
                // If it's the first time they click, we could theoretically fetch the created draft
                // But the easiest is just let them click it.
            }
        } catch (err) {
            console.error(err);
        }
        window.open(scholarship.externalUrl, '_blank');
        
        // Refresh page to load application state
        setTimeout(() => window.location.reload(), 2000);
    } else {
        navigate(`/scholarships/${scholarship._id}/apply`);
    }
  };

  const handleMarkExternalSubmitted = async () => {
    if (!application || application.status !== 'link_opened') return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/scholarships/applications/${application._id}/status`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'submitted' })
        });
        if (res.ok) {
            const updated = await res.json();
            setApplication(updated);
        }
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!scholarship) return <div className="text-center p-24">Scholarship not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/scholarships')} className="-ml-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Scholarships
          </Button>
          
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <select 
              value={targetLanguage} 
              onChange={(e) => handleTranslate(e.target.value)}
              disabled={translating}
              className="text-sm border rounded-md px-2 py-1 bg-background"
            >
              <option value="en">English (Original)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="zh">Chinese</option>
              <option value="hi">Hindi</option>
            </select>
            {translating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

          <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                  {scholarship.status === 'expired' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-800 dark:text-red-300 px-4 py-3 rounded-md flex gap-2 items-start text-sm mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                      <div>
                        <p className="font-bold">This scholarship has expired.</p>
                        <p>The deadline has passed and applications are no longer being accepted.</p>
                      </div>
                    </div>
                  )}
                  {translatedContent && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-md flex justify-between items-center text-sm mb-4">
                      <span>This content has been machine-translated.</span>
                      <Button variant="link" className="h-auto p-0 text-blue-600 dark:text-blue-400" onClick={() => handleTranslate('en')}>
                        View original
                      </Button>
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold tracking-tight">
                        {translatedContent ? translatedContent.title : scholarship.title}
                      </h1>
                      <ProviderTrustBadge status={scholarship.providerVerification} />
                      <CommunityTrustBadge scholarshipId={scholarship._id} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {scholarship.competitionSignal && (
                        <Badge variant={
                          scholarship.competitionSignal === 'higher_competition' ? 'destructive' :
                          scholarship.competitionSignal === 'moderate_competition' ? 'secondary' : 'default'
                        }>
                          {scholarship.competitionSignal.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Badge>
                      )}
                      {trustStats && trustStats.reviewCount > 0 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/30">
                          ★ {trustStats.averageRating.toFixed(1)} ({trustStats.reviewCount})
                        </Badge>
                      )}
                      {scholarship.status === 'archived' && (
                        <Badge variant="secondary" className="bg-muted">Archived</Badge>
                      )}
                    </div>
                    <p className="text-xl text-muted-foreground">{scholarship.provider}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-lg">{scholarship.averageRating?.toFixed(1) || "0.0"}</span>
                        <span className="text-muted-foreground text-sm">({scholarship.reviewCount || 0} reviews)</span>
                      </div>
                      
                      {scholarship.institutionExclusivity && user?.institution === scholarship.institutionExclusivity && (
                         <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                             Priority for {scholarship.institutionExclusivity} students
                         </Badge>
                      )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                        {scholarship.applicationMode === 'in_app' ? 'In-App Application' : 'External Application'}
                    </Badge>
                    {scholarship.sponsorCompany && (
                        <Badge variant="default" className="px-3 py-1 bg-blue-600 hover:bg-blue-700">
                            Sponsored by {scholarship.sponsorCompany}
                        </Badge>
                    )}
                    {scholarship.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>

                {user && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2 font-medium text-primary">
                                <Sparkles className="h-4 w-4" /> Matched for you
                            </div>
                            {explanation ? (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{explanation}</p>
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

                {matchedPaths.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-route text-primary"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
                            Linked Career Paths
                        </h3>
                        {matchedPaths.map((path, idx) => (
                            <Card key={idx} className="bg-muted/30 border-muted">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{path.title}</p>
                                        <p className="text-sm text-muted-foreground">This scholarship fits your {path.type || 'active path'}.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => navigate(`/classes/learning-paths/${path._id}`)}>
                                        View Path
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-xl font-bold">About this Scholarship</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {translatedContent ? translatedContent.description : scholarship.description}
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
                        {scholarship.eligibility.diversityTags && scholarship.eligibility.diversityTags.length > 0 && (
                            <li>• Targeted Groups: <strong className="text-foreground capitalize">{scholarship.eligibility.diversityTags.join(', ')}</strong></li>
                        )}
                    </ul>
                </div>
                
                {isAwarded && (
                    <div className="mt-8">
                        {scholarship.sponsorCompany && (
                            <EmployerFastTrackConsent 
                                scholarshipId={scholarship._id} 
                                sponsorCompany={scholarship.sponsorCompany} 
                            />
                        )}
                        <SubmitAwardeeStory 
                            scholarshipId={scholarship._id} 
                            onSubmitted={() => {
                                fetch(`${API_URL}/api/scholarships/${id}/awardee-stories`)
                                    .then(r => r.json())
                                    .then(data => setAwardeeStories(data));
                            }} 
                        />
                    </div>
                )}

                {awardeeStories.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Awardee Impact Stories
                        </h3>
                        <div className="space-y-4">
                            {awardeeStories.map(story => (
                                <Card key={story._id} className="bg-amber-500/5 border-amber-500/20">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                                                {story.showRealName && story.authorName ? story.authorName.charAt(0) : 'A'}
                                            </div>
                                            <div>
                                                <p className="font-medium">{story.showRealName && story.authorName ? story.authorName : 'A StudentHub student'}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    Impact Area: <Badge variant="outline" className="text-xs font-normal bg-background">{story.impactArea}</Badge>
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm italic text-muted-foreground">"{story.content}"</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
                
                <ScholarshipReviews 
                    scholarshipId={scholarship._id} 
                    averageRating={scholarship.averageRating} 
                    reviewCount={scholarship.reviewCount} 
                    hasApplication={hasApplication}
                />

                {scholarship.status === 'archived' && pastCycles && (
                    <div className="mt-8 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-5 w-5" />
                            Past Cycles History
                        </h3>
                        <Card className="bg-muted/10">
                            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Last Cycle Amount</p>
                                    <p className="text-lg font-bold">${pastCycles.pastAmount?.toLocaleString() || scholarship.amount?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Past Reviews</p>
                                    <p className="text-lg font-bold">{pastCycles.pastReviewsCount || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Impact Stories</p>
                                    <p className="text-lg font-bold">{pastCycles.pastStoriesCount || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                                    <Badge variant="secondary">Closed</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                  )}
            </div>

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

                        {(scholarship.status === 'expired' || scholarship.status === 'archived') ? (
                          <div className="w-full">
                            <Button size="lg" className="w-full font-bold text-lg" disabled>
                              Cycle Closed
                            </Button>
                            <p className="text-sm text-center text-muted-foreground mt-2">
                              This scholarship cycle has ended.
                            </p>
                          </div>
                        ) : application?.status === 'submitted' || application?.status === 'awarded' ? (
                          <div className="w-full text-center p-3 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-md font-medium flex items-center justify-center gap-2 border border-green-200 dark:border-green-800">
                              <CheckCircle2 className="h-5 w-5" /> Application Submitted
                          </div>
                        ) : application?.status === 'link_opened' && scholarship.applicationMode === 'external_link' ? (
                          <div className="w-full space-y-3">
                              <Button size="lg" className="w-full font-bold text-lg bg-green-600 hover:bg-green-700 text-white" onClick={handleMarkExternalSubmitted}>
                                  <CheckCircle2 className="mr-2 h-5 w-5" /> Mark as Applied
                              </Button>
                              <Button variant="outline" className="w-full font-semibold" onClick={handleApply}>
                                  Open Link Again <ExternalLink className="ml-2 h-4 w-4" />
                              </Button>
                          </div>
                        ) : (
                          <Button size="lg" className="w-full font-bold text-lg" onClick={handleApply}>
                              {scholarship.applicationMode === 'in_app' ? 'Apply Now' : 'Apply Externally'}
                              {scholarship.applicationMode === 'external_link' && <ExternalLink className="ml-2 h-4 w-4" />}
                          </Button>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                      <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" /> Share
                      </Button>
                      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                              <Flag className="h-4 w-4 mr-2" /> Report
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Report Scholarship</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Please tell us why you are reporting this scholarship. Our moderation team will review it shortly.</p>
                            <Textarea 
                                placeholder="Reason for reporting (e.g., broken link, scam, inaccurate info)..." 
                                value={reportReason} 
                                onChange={(e) => setReportReason(e.target.value)} 
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleReport}>Submit Report</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                  </div>
              </div>
          </div>
        </div>
      </div>
    );
  };

export default ScholarshipDetail;

