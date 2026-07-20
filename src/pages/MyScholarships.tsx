import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2, List, LayoutGrid, CalendarDays, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ApplicantFeedbackForm } from "@/components/scholarships/ApplicantFeedbackForm";
import { ProviderFeedbackSummaryModal } from "@/components/scholarships/ProviderFeedbackSummaryModal";
import { Layers } from "lucide-react";
import { ComplianceSection } from "@/components/scholarships/ComplianceSection";
import { format, differenceInDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScholarshipAnalytics } from "@/components/scholarships/ScholarshipAnalytics";
import { ScholarshipCoach } from "@/components/scholarships/ScholarshipCoach";
import { FundingDashboard } from "@/components/scholarships/FundingDashboard";
import { PortfolioOptimizer } from "@/components/scholarships/PortfolioOptimizer";
import { ScholarshipBuddy } from "@/components/scholarships/ScholarshipBuddy";
import { ReminderSettingsModal } from "@/components/scholarships/ReminderSettingsModal";
import { ShareToCircleModal } from "@/components/scholarships/ShareToCircleModal";
import { Calendar } from "@/components/ui/calendar";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyScholarships = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [feedbackAppId, setFeedbackAppId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/scholarships/my-dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
        const listRes = await fetch(`${API_URL}/api/scholarships/my-submitted`, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (res.ok) {
            const data = await res.json();
            // Ensure sorting by deadline urgency (closest first)
            data.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
            setScholarships(data);
        }
        if (listRes.ok) {
            setMyListings(await listRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUrgencyIndicator = (dateString: string) => {
      const days = differenceInDays(new Date(dateString), new Date());
      if (days < 0) return <Badge variant="destructive">Expired</Badge>;
      if (days === 0) return <Badge variant="destructive">Due Today!</Badge>;
      if (days <= 3) return <Badge variant="destructive" className="bg-orange-500">Due in {days} days</Badge>;
      if (days <= 14) return <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">Due in {days} days</Badge>;
      return <Badge variant="outline">{days} days left</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Scholarships</h1>
                <p className="text-muted-foreground">Track your saved and active scholarship applications.</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
                <Button variant="default" size="sm" onClick={() => navigate('/scholarships/batch-apply')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Layers className="h-4 w-4 mr-2" /> Batch Apply
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/scholarships/compliance')} className="border-primary text-primary hover:bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Compliance
                </Button>
                <ReminderSettingsModal />
                <div className="flex bg-muted p-1 rounded-md">
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                        <List className="h-4 w-4 mr-2" /> List
                    </Button>
                    <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}>
                        <CalendarDays className="h-4 w-4 mr-2" /> Calendar
                    </Button>
                </div>
            </div>
        </div>

        <Tabs defaultValue="applications" className="w-full">
            <TabsList className="mb-6">
                <TabsTrigger value="applications">My Applications</TabsTrigger>
                <TabsTrigger value="listings">Provided by Me</TabsTrigger>
            </TabsList>

            <TabsContent value="applications">
                <FundingDashboard />
                
                <PortfolioOptimizer savedScholarships={scholarships.filter(s => s.applicationStatus === 'saved')} />

                <ScholarshipAnalytics />

        {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : scholarships.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed rounded-lg bg-muted/20">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No scholarships tracked yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">You haven't saved or started any scholarship applications. Browse the directory to find opportunities.</p>
                <Button onClick={() => navigate('/scholarships')}>Browse Scholarships</Button>
            </div>
        ) : viewMode === 'list' ? (
            <div className="grid gap-4">
                {scholarships.map(sch => (
                    <Card key={sch.scholarshipId} className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold">{sch.title}</h3>
                                    {getUrgencyIndicator(sch.deadline)}
                                </div>
                                <p className="text-muted-foreground text-sm">{sch.provider}</p>
                                <div className="flex items-center gap-4 text-sm mt-4">
                                      <div className="flex items-center gap-1.5 text-muted-foreground mt-2 md:mt-0">
                                          <CalendarIcon className="h-4 w-4" />
                                          <span>Deadline: {format(new Date(sch.deadline), 'MMM d, yyyy')}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                                        <Badge variant={sch.applicationStatus === 'saved' ? 'outline' : 'secondary'}>
                                            Status: {sch.applicationStatus.replace('_', ' ')}
                                        </Badge>
                                        {(sch.applicationStatus === 'link_opened' || ['submitted', 'awarded', 'rejected', 'withdrawn'].includes(sch.applicationStatus)) && sch.applicationId && (
                                          <select 
                                            className="text-xs border rounded p-1 bg-background"
                                            value={sch.applicationStatus}
                                            onChange={async (e) => {
                                              const newStatus = e.target.value;
                                              try {
                                                const token = localStorage.getItem('token');
                                                const res = await fetch(`${API_URL}/api/scholarships/applications/${sch.applicationId}/status`, {
                                                  method: 'PATCH',
                                                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ status: newStatus })
                                                });
                                                if (res.ok) {
                                                  setScholarships(prev => prev.map(p => p._id === sch._id ? { ...p, applicationStatus: newStatus } : p));
                                                  if (newStatus === 'submitted') {
                                                    setFeedbackAppId(sch.applicationId);
                                                  }
                                                }
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            }}
                                          >
                                            <option value="link_opened" disabled>Link Opened</option>
                                            <option value="submitted">Submitted</option>
                                            <option value="awarded">Awarded</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="withdrawn">Withdrawn</option>
                                          </select>
                                        )}
                                      </div>
                                  </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                  <div className="flex gap-2">
                                      <ShareToCircleModal scholarshipId={sch.scholarshipId} />
                                      <Button variant="default" onClick={() => navigate(`/scholarships/${sch.scholarshipId}`)}>
                                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                                      </Button>
                                  </div>
                                  {['submitted', 'under_review', 'awarded', 'rejected'].includes(sch.applicationStatus) && (
                                      <ApplicantFeedbackForm scholarshipId={sch.scholarshipId} providerName={sch.provider} />
                                  )}
                                  {sch.applicationStatus === 'awarded' && (
                                      <ComplianceSection applicationId={sch.applicationId} />
                                  )}
                              </div>
                          </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="border rounded-lg p-6 bg-card flex flex-col md:flex-row gap-8">
                <div className="flex-1 md:max-w-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" /> Calendar View
                    </h3>
                    <div className="border rounded-md p-4 bg-background">
                        <Calendar 
                            mode="single"
                            modifiers={{
                                activeDeadline: scholarships.map(s => new Date(s.deadline))
                            }}
                            modifiersClassNames={{
                                activeDeadline: "bg-primary text-primary-foreground font-bold hover:bg-primary hover:text-primary-foreground"
                            }}
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Upcoming Deadlines</h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {scholarships.length === 0 ? (
                        <p className="text-muted-foreground">No upcoming deadlines.</p>
                    ) : (
                        scholarships.map((sch) => (
                            <Card key={sch.scholarshipId} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/scholarships/${sch.scholarshipId}`)}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-bold text-primary mb-1">{format(new Date(sch.deadline), 'MMMM d, yyyy')}</div>
                                        <h4 className="font-bold">{sch.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{sch.provider}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        {getUrgencyIndicator(sch.deadline)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                    </div>
                </div>
            </div>
        )}
            </TabsContent>

            <TabsContent value="listings">
                {loading ? (
                    <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : myListings.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed rounded-lg bg-muted/20">
                        <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No scholarships provided yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">You haven't submitted any scholarships to the platform.</p>
                        <Button onClick={() => navigate('/scholarships/submit')}>Submit a Scholarship</Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {myListings.map(sch => (
                            <Card key={sch._id} className="hover:border-primary/50 transition-colors">
                                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-xl font-bold">{sch.title}</h3>
                                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                            <span>Status: <Badge variant="outline">{sch.status}</Badge></span>
                                            <span>Deadline: {format(new Date(sch.applicationDeadline), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <ProviderFeedbackSummaryModal scholarshipId={sch._id} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
      </div>
      <div className="flex flex-col space-y-8">
        <ScholarshipBuddy />
      </div>
    </div>
  );
};

export default MyScholarships;



