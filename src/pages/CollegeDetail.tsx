import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, Star, DollarSign, TrendingUp, Users, Award, 
  ExternalLink, Heart, Scale, Building2, BookOpen, GraduationCap, ArrowLeft, ThumbsUp, Flag, CheckCircle, ShieldCheck, Calendar, Trophy
} from "lucide-react";
import { useColleges } from "@/hooks/useColleges";
import { ReviewFormDialog } from "@/components/colleges/ReviewFormDialog";
import { CollegeQA } from "@/components/colleges/CollegeQA";
import { CollegeAlumniDirectory } from "@/components/colleges/CollegeAlumniDirectory";
import { RealityCheck } from "@/components/colleges/RealityCheck";
import { CollegeSalaryInsights } from "@/components/colleges/CollegeSalaryInsights";
import { CollegeClaimButton } from "@/components/colleges/CollegeClaimButton";
import { AddToTrackerButton } from "@/components/colleges/AddToTrackerButton";
import { FeedLayout } from "@/components/community-feed/FeedLayout";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const CollegeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getCollege, getReviews, getRatingBreakdown, getSavedColleges, toggleSaveCollege, getFeeReminder, saveFeeReminder } = useColleges();
  
  const [college, setCollege] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const [reviewsData, setReviewsData] = useState<any>({ reviews: [], distribution: {} });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSort, setReviewSort] = useState("helpful");
  const [verifiedFirst, setVerifiedFirst] = useState(false);
  const [ratingBreakdown, setRatingBreakdown] = useState<any>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [collegeEvents, setCollegeEvents] = useState<any>({ upcoming: [], past: [] });
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [feeReminderOpen, setFeeReminderOpen] = useState(false);
  const [feeReminderNote, setFeeReminderNote] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getCollege(id);
        setCollege(data);
        
        getRatingBreakdown(id).then(setRatingBreakdown).catch(e => console.error("Error fetching breakdown", e));
        
        if (user) {
          const saved = await getSavedColleges();
          const savedStatus = saved.some((c: any) => (c._id || c) === id);
          setIsSaved(savedStatus);
          
          if (savedStatus) {
            getFeeReminder(id).then(note => setFeeReminderNote(note || "")).catch(() => {});
          }

          // Track view for personalization
          const token = localStorage.getItem("token");
          if (token) {
            fetch(`${API_URL}/api/colleges/${id}/view`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
            }).catch(e => console.error("Error tracking view", e));
          }
        }
        
        // Fetch college events
        setLoadingEvents(true);
        try {
          const eventsRes = await fetch(`${API_URL}/api/colleges/${id}/events`);
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setCollegeEvents(eventsData);
          }
        } catch (e) {
          console.error("Error fetching college events", e);
        } finally {
          setLoadingEvents(false);
        }
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user]);

  const loadReviewPage = async (page: number, sortOverride?: string, verifiedOverride?: boolean) => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const s = sortOverride ?? reviewSort;
      const v = verifiedOverride ?? verifiedFirst;
      const data = await getReviews(id, page, s, v);
      setReviewsData(data);
      setReviewsPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (id) loadReviewPage(1);
  }, [id]);

  const handleSave = async () => {
    if (!id || !user) return; // Add login prompt later
    try {
      await toggleSaveCollege.mutateAsync({ id, isSaved });
      setIsSaved(!isSaved);
    } catch (error) {
      console.error(error);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/colleges/${id}/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadReviewPage(reviewsPage); // Refresh
    } catch (error) {
      console.error(error);
    }
  };

  const handleReport = async () => {
    if (!reportReviewId || !reportReason.trim()) return;
    setReportSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/reviews/${reportReviewId}/report`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: reportReason })
      });
      if (res.ok) {
        import("sonner").then(({ toast }) => toast.success("Review reported successfully"));
        setReportModalOpen(false);
        setReportReason("");
      } else {
        throw new Error("Failed to report");
      }
    } catch (error) {
      console.error(error);
      import("sonner").then(({ toast }) => toast.error("Error reporting review"));
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSaveFeeReminder = async () => {
    if (!id) return;
    setSavingReminder(true);
    try {
      await saveFeeReminder(id, feeReminderNote);
      import("sonner").then(({ toast }) => toast.success("Fee reminder saved successfully"));
      setFeeReminderOpen(false);
    } catch (e) {
      // Error handled in hook
    } finally {
      setSavingReminder(false);
    }
  };

  const handleAddToCompare = () => {
    if (!college) return;
    const stored = sessionStorage.getItem("compareList");
    const current = stored ? JSON.parse(stored) : [];
    if (!current.some((c: any) => c._id === college._id)) {
      if (current.length >= 20) {
        import("sonner").then(({ toast }) => toast.error("Maximum 20 colleges allowed for comparison"));
        return;
      }
      current.push(college);
      sessionStorage.setItem("compareList", JSON.stringify(current));
      import("sonner").then(({ toast }) => toast.success("Added to Compare"));
      window.dispatchEvent(new Event("storage"));
    } else {
      import("sonner").then(({ toast }) => toast.info("Already added to compare"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-64 w-full bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-16 relative z-8 space-y-8">
          <Skeleton className="h-32 w-32 rounded-xl" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">College Not Found</h2>
          <p className="text-muted-foreground mb-6">The college you're looking for doesn't exist or has been removed.</p>
          <Link to="/college-insights">
            <Button><ArrowLeft className="mr-2 h-4 w-4" /> Back to Colleges</Button>
          </Link>
        </div>
      </div>
    );
  }

  const bannerImg = getImageUrl(college.images?.[0]) || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Banner */}
      <div className="h-64 md:h-80 w-full relative">
        <div className="absolute inset-0 bg-black/40 z-8" />
        <img src={bannerImg} alt={college.name} className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-24 flex-1 mb-16">
        {/* Header Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xl flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
          <div className="h-24 w-24 md:h-32 md:w-32 bg-background border border-border rounded-xl flex items-center justify-center text-5xl md:text-6xl shrink-0 shadow-sm -mt-12 md:-mt-16">
            {college.logoOrIcon || "🏛️"}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="default" className="text-sm">{college.type}</Badge>
              {college.accreditation && <Badge variant="outline">{college.accreditation}</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 truncate">{college.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {college.location.city}, {college.location.state}</span>
              {college.establishedYear && <span>Est. {college.establishedYear}</span>}
              {college.website && (
                <a href={college.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" /> Official Website
                </a>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-3 w-full md:w-auto mt-4 md:mt-0 flex-wrap justify-end">
            <CollegeClaimButton collegeId={id!} />
            <AddToTrackerButton collegeId={id!} />
            <Button variant="outline" onClick={handleAddToCompare} className="flex-1 md:flex-none">
              <Scale className="mr-2 h-4 w-4" /> Compare
            </Button>
            <Button 
              variant={isSaved ? "default" : "outline"} 
              onClick={handleSave}
              className={`flex-1 md:flex-none ${isSaved ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : ''}`}
            >
              <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} /> 
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Avg Package", value: college.avgPackage || "N/A", icon: TrendingUp, color: "text-green-500" },
            { label: "Placement", value: college.placementPercentage ? `${college.placementPercentage}%` : "N/A", icon: Users, color: "text-blue-500" },
            { label: "Tuition (Yr)", value: `₹${(college.fees.tuition/100000).toFixed(1)}L`, icon: DollarSign, color: "text-yellow-500" },
            { label: "Rating", value: college.rating?.toFixed(1) || "N/A", sub: `(${college.totalReviews} reviews)`, icon: Star, color: "text-warning" },
            { label: "Top Rank", value: college.accreditation?.split(' ')[2] || "N/A", icon: Award, color: "text-purple-500" },
          ].map((stat, i) => (
            <Card key={i} className="border-border bg-card/50">
              <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
                <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="font-bold text-lg">{stat.value}</div>
                {stat.sub && <div className="text-xs text-muted-foreground">{stat.sub}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b border-border rounded-none h-auto p-0 mb-6 flex-nowrap hide-scrollbar">
            {["Overview", "Courses & Fees", "Placements & Salary", "Facilities", "Events", "Reviews", "Q&A", "Alumni", "Community"].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab.toLowerCase().replace(' & ', '-')}
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-base whitespace-nowrap"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
            <RealityCheck collegeId={id!} />
            
            <Card className="border-border">
              <CardHeader><CardTitle>About {college.name}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {college.name} is a premier {college.type} institution located in {college.location.city}, {college.location.state}. 
                  Established in {college.establishedYear}, it has grown to become one of the top engineering and technology institutes in the country.
                  {college.admissionProcess && ` ${college.admissionProcess}`}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses-fees" className="space-y-6 animate-in fade-in duration-500">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-border">
                <CardHeader><CardTitle>Courses Offered</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg font-medium">Course Name</th>
                          <th className="px-4 py-3 font-medium">Duration</th>
                          <th className="px-4 py-3 font-medium">Seats</th>
                          <th className="px-4 py-3 rounded-tr-lg font-medium">Eligibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {college.coursesOffered?.map((course: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{course.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{course.duration}</td>
                            <td className="px-4 py-3 text-muted-foreground">{course.seats}</td>
                            <td className="px-4 py-3 text-muted-foreground">{course.eligibility}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border h-fit">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Fee Structure</CardTitle>
                  {isSaved && (
                    <Button variant="outline" size="sm" onClick={() => setFeeReminderOpen(true)}>
                      Set Reminder
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {college.feeStructure && college.feeStructure.length > 0 ? (
                    college.feeStructure.map((fs: any, i: number) => (
                      <div key={i} className="mb-6 last:mb-0">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-primary">{fs.year}</h4>
                          <Badge variant="secondary" className="text-[10px]">
                            {fs.source === 'official' ? 'Official' : fs.source === 'crowd-reported' ? 'Crowdsourced' : 'Admin Verified'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between border-b border-border py-1">
                            <span className="text-muted-foreground">Tuition</span>
                            <span className="font-medium">₹{(fs.tuition || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-border py-1">
                            <span className="text-muted-foreground">Hostel</span>
                            <span className="font-medium">₹{(fs.hostel || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-border py-1">
                            <span className="text-muted-foreground">Mess</span>
                            <span className="font-medium">₹{(fs.mess || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-border py-1">
                            <span className="text-muted-foreground">Other Charges</span>
                            <span className="font-medium">₹{(fs.otherCharges || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1 font-bold pt-2">
                            <span>Total</span>
                            <span className="text-primary">₹{(fs.total || 0).toLocaleString()}</span>
                          </div>
                          {fs.lastVerified && (
                            <div className="text-right text-[10px] text-muted-foreground mt-1">
                              Last verified: {new Date(fs.lastVerified).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Tuition Fee</span>
                        <span className="font-medium">₹{(college.fees?.tuition || 0).toLocaleString()}/yr</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Hostel Fee</span>
                        <span className="font-medium">₹{(college.fees?.hostel || 0).toLocaleString()}/yr</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Other Fees</span>
                        <span className="font-medium">₹{(college.fees?.other || 0).toLocaleString()}/yr</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          ₹{((college.fees?.tuition || 0) + (college.fees?.hostel || 0) + (college.fees?.other || 0)).toLocaleString()}/yr
                        </span>
                      </div>
                      <div className="text-xs text-center text-muted-foreground mt-4">
                        * Detailed year-wise breakdown is not available for this college yet.
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="placements-salary" className="space-y-6 animate-in fade-in duration-500">
             <Card className="border-border">
              <CardHeader><CardTitle>Placement Highlights</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6 text-center">
                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                  <div className="text-3xl font-bold text-green-500 mb-2">{college.avgPackage || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">Average Package</div>
                </div>
                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                  <div className="text-3xl font-bold text-primary mb-2">{college.highestPackage || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">Highest Package</div>
                </div>
                <div className="bg-muted/30 p-6 rounded-xl border border-border">
                  <div className="text-3xl font-bold text-blue-500 mb-2">{college.placementPercentage || "N/A"}%</div>
                  <div className="text-sm text-muted-foreground">Placement Rate</div>
                </div>
              </CardContent>
            </Card>
            
            <CollegeSalaryInsights collegeId={id!} />
          </TabsContent>

          <TabsContent value="facilities" className="animate-in fade-in duration-500">
            <Card className="border-border">
              <CardHeader><CardTitle>Campus Facilities</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {college.facilities?.map((fac: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {fac.toLowerCase().includes('hostel') ? <Building2 className="h-4 w-4" /> :
                         fac.toLowerCase().includes('library') ? <BookOpen className="h-4 w-4" /> :
                         fac.toLowerCase().includes('lab') ? <GraduationCap className="h-4 w-4" /> :
                         <Award className="h-4 w-4" />}
                      </div>
                      <span className="font-medium text-sm">{fac}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Events at {college.name}</CardTitle>
                <Link to={`/events?college=${college._id}`}>
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loadingEvents ? (
                  <div className="flex justify-center p-8"><Skeleton className="h-40 w-full rounded-xl" /></div>
                ) : collegeEvents.upcoming?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {collegeEvents.upcoming.map((event: any) => (
                      <Link to={`/events/${event._id}`} key={event._id}>
                        <div className="flex border border-border rounded-xl overflow-hidden hover:border-primary transition-colors h-32 group cursor-pointer">
                          <div className="w-1/3 relative bg-muted shrink-0">
                            {event.bannerImage ? (
                              <img src={getImageUrl(event.bannerImage)} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><Calendar className="h-8 w-8" /></div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col justify-center overflow-hidden w-full bg-card">
                            <div className="flex gap-2 mb-1">
                              <Badge variant={event.eventType as any} className="text-[10px] py-0 h-4 capitalize">{event.eventType}</Badge>
                            </div>
                            <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h4>
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No upcoming events currently scheduled.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {collegeEvents.past?.length > 0 && (
              <Card className="border-border">
                <CardHeader><CardTitle>Past Events</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {collegeEvents.past.slice(0, 4).map((event: any) => (
                      <Link to={`/events/${event._id}`} key={event._id}>
                        <div className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {event.bannerImage ? <img src={getImageUrl(event.bannerImage)} alt={event.title} className="w-full h-full object-cover" /> : <Calendar className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate">{event.title}</h5>
                            <p className="text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="animate-in fade-in duration-500">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Rating Summary */}
              <Card className="border-border h-fit">
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-4 border-b border-border">
                    <div className="text-5xl font-bold mb-2">{college.rating?.toFixed(1) || "0.0"}</div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-4 w-4 ${s <= (college.rating||0) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">{college.totalReviews} total reviews</div>
                  </div>
                  
                  <div className="space-y-2">
                    {[5,4,3,2,1].map(stars => {
                      const count = reviewsData.distribution?.[stars] || 0;
                      const percent = college.totalReviews > 0 ? (count / college.totalReviews) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 text-sm">
                          <span className="w-4">{stars}</span>
                          <Star className="h-3 w-3 text-warning fill-warning" />
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-warning" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-8 text-right text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {ratingBreakdown && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <h4 className="text-sm font-semibold">Category Ratings</h4>
                      {[
                        { key: 'academics', label: 'Academics' },
                        { key: 'faculty', label: 'Faculty' },
                        { key: 'infrastructure', label: 'Infrastructure' },
                        { key: 'placements', label: 'Placements' },
                        { key: 'campusLife', label: 'Campus Life' },
                        { key: 'hostel', label: 'Hostel' },
                        { key: 'labs', label: 'Labs' }
                      ].map(cat => {
                        const val = ratingBreakdown[`avg${cat.label.replace(' ', '')}Rating`] || 0;
                        return val > 0 ? (
                          <div key={cat.key} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{cat.label}</span>
                            <div className="flex items-center gap-1 font-medium">
                              {val.toFixed(1)} <Star className="h-3 w-3 fill-warning text-warning" />
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <ReviewFormDialog collegeId={college._id} onSuccess={() => loadReviewPage(1)} />
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="md:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl font-bold">Student Reviews</h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="checkbox" className="accent-primary" checked={verifiedFirst} onChange={(e) => {
                        setVerifiedFirst(e.target.checked);
                        loadReviewPage(1, reviewSort, e.target.checked);
                      }} />
                      Verified First
                    </label>
                    <Select value={reviewSort} onValueChange={(val) => {
                      setReviewSort(val);
                      loadReviewPage(1, val, verifiedFirst);
                    }}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="helpful">Most Helpful</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="highest">Highest Rated</SelectItem>
                        <SelectItem value="lowest">Lowest Rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {loadingReviews ? (
                  <Skeleton className="h-40 w-full" />
                ) : reviewsData.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.reviews.map((review: any) => (
                      <Card key={review._id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {review.userId?.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {review.userId?.full_name || 'Anonymous User'}
                                  {review.verificationStatus === "verified" ? (
                                    <Badge variant="outline" className="text-[10px] h-4 bg-green-500/10 text-green-600 border-green-500/20 gap-1 px-1.5">
                                      <ShieldCheck className="h-3 w-3"/> Verified Student
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px] h-4 bg-muted text-muted-foreground gap-1 px-1.5">
                                      Unverified
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {review.courseStudied && `${review.courseStudied} • `}
                                  {review.yearAttended && `Class of ${review.yearAttended} • `}
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded text-sm font-bold">
                                {review.rating} <Star className="h-3 w-3 fill-warning" />
                              </div>
                              <button 
                                onClick={() => { setReportReviewId(review._id); setReportModalOpen(true); }} 
                                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                              >
                                <Flag className="h-3 w-3" /> Report
                              </button>
                            </div>
                          </div>
                          
                          <h4 className="font-bold mb-2">{review.title}</h4>
                          <p className="text-muted-foreground text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                            {review.reviewText}
                          </p>

                          {review.categoryRatings && Object.keys(review.categoryRatings).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {Object.entries(review.categoryRatings).map(([key, val]) => (val as number) > 0 ? (
                                <Badge key={key} variant="outline" className="text-xs text-muted-foreground font-normal bg-muted/20">
                                  {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}: {val as any} ★
                                </Badge>
                              ) : null)}
                            </div>
                          )}
                          
                          {(review.pros?.length > 0 || review.cons?.length > 0) && (
                            <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm bg-muted/20 p-3 rounded-lg border border-border">
                              {review.pros?.length > 0 && (
                                <div>
                                  <span className="font-semibold text-green-500 block mb-1">Pros</span>
                                  <ul className="list-disc pl-4 text-muted-foreground">
                                    {review.pros.map((pro: string, idx: number) => (
                                      <li key={idx}>{pro}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {review.cons?.length > 0 && (
                                <div>
                                  <span className="font-semibold text-red-500 block mb-1">Cons</span>
                                  <ul className="list-disc pl-4 text-muted-foreground">
                                    {review.cons.map((con: string, idx: number) => (
                                      <li key={idx}>{con}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {review.wouldRecommend !== undefined && review.wouldRecommend !== null && (
                            <div className="mb-4">
                              <Badge variant={review.wouldRecommend ? "default" : "destructive"} className="text-xs font-medium">
                                {review.wouldRecommend ? "✓ Would Recommend" : "✕ Would Not Recommend"}
                              </Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                            <span className="text-xs text-muted-foreground">Was this helpful?</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleHelpful(review._id)}>
                              <ThumbsUp className="mr-1 h-3 w-3" /> {review.helpfulVotes || 0}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Pagination */}
                    {reviewsData.pages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <Button 
                          variant="outline" 
                          disabled={reviewsPage === 1}
                          onClick={() => loadReviewPage(reviewsPage - 1)}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm font-medium">
                          Page {reviewsPage} of {reviewsData.pages}
                        </span>
                        <Button 
                          variant="outline" 
                          disabled={reviewsPage === reviewsData.pages}
                          onClick={() => loadReviewPage(reviewsPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground mb-4">No reviews yet for this college.</p>
                    <ReviewFormDialog collegeId={college._id} onSuccess={() => loadReviewPage(1)} />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="q&a" className="animate-in fade-in duration-500">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <CollegeQA collegeId={college._id} />
            </div>
          </TabsContent>

          <TabsContent value="alumni" className="m-0 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Alumni Network
                </h3>
                <p className="text-muted-foreground">
                  Connect with {college.name} alumni for mentorship, career advice, and Q&A.
                </p>
              </div>
              <CollegeAlumniDirectory collegeId={college._id} />
            </div>
          </TabsContent>

          <TabsContent value="community" className="animate-in fade-in duration-500">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <FeedLayout collegeId={college._id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for reporting</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spam">Spam</SelectItem>
                  <SelectItem value="Fake / Not a real student">Fake / Not a real student</SelectItem>
                  <SelectItem value="Inappropriate content">Inappropriate content</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={!reportReason || reportSubmitting}>
              {reportSubmitting ? "Reporting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={feeReminderOpen} onOpenChange={setFeeReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Fee Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Add a personal note or reminder regarding fee deadlines, scholarship targets, or financial aid to-dos for {college?.name}. (Only visible to you)
            </p>
            <Textarea
              placeholder="e.g. Apply for merit scholarship before Aug 15th. Check if hostel fees are refundable."
              className="min-h-[100px]"
              value={feeReminderNote}
              onChange={(e) => setFeeReminderNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeeReminderOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFeeReminder} disabled={savingReminder}>
              {savingReminder ? "Saving..." : "Save Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollegeDetail;
