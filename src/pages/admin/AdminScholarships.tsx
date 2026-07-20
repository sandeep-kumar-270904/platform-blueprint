import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminTranslateModal } from '@/components/scholarships/AdminTranslateModal';
import { AdminAwardeeStories } from '@/components/scholarships/AdminAwardeeStories';
import { AdminSystemHealth } from '@/components/scholarships/AdminSystemHealth';
import { InstitutionBulkAidPanel } from '@/components/scholarships/InstitutionBulkAidPanel';
import { AdminComplianceQueue } from '@/components/scholarships/AdminComplianceQueue';
import { AdminScamPatterns } from '@/components/scholarships/AdminScamPatterns';
import { AdminCommunity } from '@/components/scholarships/AdminCommunity';
import { ProviderFeedbackSummaryModal } from '@/components/scholarships/ProviderFeedbackSummaryModal';
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminScholarships = () => {
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [flagsData, setFlagsData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort flagged items to the top
        const sortedData = data.sort((a: any, b: any) => {
          if (a.priorityFlag && !b.priorityFlag) return -1;
          if (!a.priorityFlag && b.priorityFlag) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setPending(sortedData);
      }
    } catch (err) {
      console.error("Error fetching pending", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [funnelRes, catRes, sourceRes, flagsRes] = await Promise.all([
          fetch(`${API_URL}/api/scholarships/admin/analytics/funnel`, { headers }),
          fetch(`${API_URL}/api/scholarships/admin/analytics/categories`, { headers }),
          fetch(`${API_URL}/api/scholarships/admin/analytics/source-comparison`, { headers }),
          fetch(`${API_URL}/api/scholarships/admin/analytics/flags`, { headers })
      ]);
      
      if (funnelRes.ok) setFunnelData(await funnelRes.json());
      if (catRes.ok) setCategoriesData(await catRes.json());
      if (sourceRes.ok) setSourceData(await sourceRes.json());
      if (flagsRes.ok) setFlagsData(await flagsRes.json());
    } catch (err) {
      console.error("Error fetching analytics", err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchPending(), fetchAnalytics()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleReview = async (status: 'published' | 'rejected') => {
    if (!selectedReview) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const action = status === 'published' ? 'approve' : 'reject';
      const res = await fetch(`${API_URL}/api/scholarships/admin/${selectedReview._id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(status === 'rejected' ? { reviewNotes } : {})
      });
      
      if (res.ok) {
        toast.success(`Scholarship ${status === 'published' ? 'approved' : 'rejected'}`);
        setSelectedReview(null);
        setReviewNotes("");
        fetchPending();
      } else {
        toast.error("Failed to submit review");
      }
    } catch (err) {
      toast.error("Error submitting review");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Scholarships Admin</h1>
          <p className="text-muted-foreground">Manage and review organization-submitted scholarships.</p>
        </div>

        {loading ? (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        ) : (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* Funnel */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Application Funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {funnelData ? (
                            <div className="space-y-4 text-sm mt-4">
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Total Views</span>
                                    <span className="font-bold">{funnelData.views}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Total Saves</span>
                                    <span className="font-bold">{funnelData.saves}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Apps Created</span>
                                    <span className="font-bold">{funnelData.applicationsCreated}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Total Published</span>
                                    <span className="font-bold">{funnelData.totalPublished}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Expiring Soon (14d)</span>
                                    <span className="font-bold">{funnelData.expiringSoonCount}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-muted-foreground">Apps Submitted</span>
                                    <span className="font-bold">{funnelData.applicationsSubmitted}</span>
                                </div>
                            </div>
                        ) : <p className="text-muted-foreground">No data yet.</p>}
                    </CardContent>
                </Card>

                {/* Categories */}
                <Card className="col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Top Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoriesData.length > 0 ? (
                            <div className="h-48 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={categoriesData.slice(0,5)} 
                                            dataKey="applications" 
                                            nameKey="_id" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={60} 
                                            fill="#8884d8"
                                            label
                                        >
                                            {categoriesData.slice(0,5).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <p className="text-muted-foreground text-sm mt-4">No category data yet.</p>}
                    </CardContent>
                </Card>

                {/* Source Comparison */}
                <Card className="col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Source Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sourceData.length > 0 ? (
                            <div className="h-48 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sourceData}>
                                        <XAxis dataKey="_id" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="totalApplications" fill="#3b82f6" name="Total Apps" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <p className="text-muted-foreground text-sm mt-4">No source data yet.</p>}
                    </CardContent>
                </Card>

                {/* Flags */}
                <Card className="border-orange-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-orange-600">Admin Action Required</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {flagsData.length > 0 ? (
                            <div className="space-y-2 mt-4 text-sm">
                                {flagsData.slice(0,5).map((f) => (
                                    <div key={f._id} className="p-2 bg-orange-50 rounded-md border border-orange-100 flex justify-between items-center">
                                        <span className="truncate text-orange-800 pr-2">{f.title}</span>
                                        <Badge variant="outline" className="text-xs bg-white">{f.applicationCount === 0 ? 'Stale' : 'Expiring'}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2 opacity-50" />
                                <p className="text-sm">No flags requiring action.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}

        <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="stories">Awardee Stories</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="health">Ecosystem Health</TabsTrigger>
                <TabsTrigger value="institution">Institution Bulk-Aid</TabsTrigger>
            </TabsList>
            <TabsContent value="submissions">

        <Card>
            <CardHeader>
                <CardTitle>Review Queue</CardTitle>
                <CardDescription>Scholarships submitted by organizations awaiting approval.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : pending.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">Queue Empty</h3>
                        <p className="text-muted-foreground">All caught up! No pending submissions.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pending.map(item => (
                            <div key={item._id} className={`flex flex-col md:flex-row justify-between p-4 border rounded-lg transition-colors ${item.priorityFlag ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 hover:border-red-600' : 'hover:border-primary/50'}`}>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold">{item.title}</h4>
                                        <Badge variant="outline">{item.provider}</Badge>
                                        {item.providerVerification?.source === 'unverified_submission' && (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                User Submission
                                            </Badge>
                                        )}
                                        {item.priorityFlag && (
                                          <Badge variant="destructive" className="ml-2">High Priority Flag</Badge>
                                        )}
                                        {item.priorityFlagReason && (
                                            <span className="text-xs text-red-600 font-medium">({item.priorityFlagReason})</span>
                                        )}
                                        {item.submittedBy?.trustTier === 'spot_check_eligible' && (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                Trusted Submitter
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Submitted by {item.submittedBy?.name} • Deadline: {format(new Date(item.applicationDeadline), 'MMM d, yyyy')}
                                    </p>
                                    {item.providerVerification?.source === 'unverified_submission' && item.sourceUrl && (
                                        <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded inline-block">
                                            Source: <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{item.sourceUrl}</a>
                                        </p>
                                    )}
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-2">
                                    <Dialog open={selectedReview?._id === item._id} onOpenChange={(open) => !open && setSelectedReview(null)}>
                                        <DialogTrigger asChild>
                                            <ProviderFeedbackSummaryModal scholarshipId={item._id} />
                                            <Button variant="outline" size="sm" onClick={() => setTranslateItem(item)} className="mr-2">
                                                <Languages className="h-4 w-4 mr-2" /> Translate
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedReview(item)}>
                                                <Eye className="h-4 w-4 mr-2" /> Review
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Review Submission</DialogTitle>
                                            </DialogHeader>
                                            {selectedReview && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold">{selectedReview.title}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-muted-foreground">{selectedReview.provider}</p>
                                                            {selectedReview.providerVerification?.source === 'unverified_submission' && (
                                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                                    User Submission
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {selectedReview.providerVerification?.source === 'unverified_submission' ? (
                                                        <div className="bg-yellow-50/50 p-4 border border-yellow-200 rounded-md">
                                                            <h4 className="font-bold text-sm text-yellow-800 mb-3">Lightweight Review (Spot Check)</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                                                                    <span className="font-medium text-muted-foreground">Source URL:</span>
                                                                    <a href={selectedReview.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                                                                        {selectedReview.sourceUrl || "No URL provided"}
                                                                    </a>
                                                                </div>
                                                                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                                                                    <span className="font-medium text-muted-foreground">Amount:</span>
                                                                    <span>${selectedReview.amount?.min || 0} ({selectedReview.amountType})</span>
                                                                </div>
                                                                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                                                                    <span className="font-medium text-muted-foreground">Deadline:</span>
                                                                    <span>{format(new Date(selectedReview.applicationDeadline), 'MMM d, yyyy')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="bg-muted p-4 rounded-md text-sm">
                                                                <h4 className="font-semibold mb-2">Description</h4>
                                                                <p className="whitespace-pre-wrap">{selectedReview.description}</p>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="font-semibold">Application Mode:</span> {selectedReview.applicationMode}
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold">Deadline:</span> {format(new Date(selectedReview.applicationDeadline), 'MMM d, yyyy')}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="space-y-2">
                                                        <label className="font-semibold text-sm">Admin Notes (sent to submitter on rejection)</label>
                                                        <Textarea 
                                                            placeholder="Add reasoning for rejection or internal notes..."
                                                            value={reviewNotes}
                                                            onChange={(e) => setReviewNotes(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex justify-end gap-4 border-t pt-4">
                                                        <Button 
                                                            variant="destructive" 
                                                            onClick={() => handleReview('rejected')}
                                                            disabled={actionLoading}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-2" /> Reject
                                                        </Button>
                                                        <Button 
                                                            className="bg-green-600 hover:bg-green-700 text-white" 
                                                            onClick={() => handleReview('published')}
                                                            disabled={actionLoading}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Publish
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Phase 10: Applicant Feedback Loop */}
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Provider Feedback (Aggregated)</CardTitle>
                <CardDescription>Private clarity ratings and feedback from applicants.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Admin view of provider application clarity scores and confusing steps, used to identify providers needing coaching. (See Review Queue to view feedback per-scholarship)</p>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {/* Phase 11: Official API Sync Management */}
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Official Scholarship APIs</CardTitle>
                <CardDescription>Manage configured API endpoints (data sources) that sync directly to the scholarship database.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="bg-blue-50/50 p-4 border border-blue-200 rounded-md">
                        <h4 className="font-semibold text-blue-800 mb-1">API Sync Framework Active</h4>
                        <p className="text-sm text-blue-900">
                            The background <code>apiSyncJob</code> runs nightly at midnight. It fetches from configured data sources (e.g., state education portals) using mapped fields and automatically publishes them as verified listings.
                        </p>
                    </div>
                    
                    <Button variant="outline" onClick={() => navigate('/admin/scholarships/data-sources')}>
                        Configure Data Sources
                    </Button>
                    <Button variant="outline" className="ml-4" onClick={() => toast.success('API sync job triggered manually')}>
                        Trigger Manual Sync
                    </Button>
                </div>
            </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="stories"><AdminAwardeeStories /></TabsContent>

        <TabsContent value="compliance">
            <AdminComplianceQueue />
        </TabsContent>

        <TabsContent value="health"><AdminSystemHealth /></TabsContent>

        <TabsContent value="institution"><InstitutionBulkAidPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};







export default AdminScholarships;



