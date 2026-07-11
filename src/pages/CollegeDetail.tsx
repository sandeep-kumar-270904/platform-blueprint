import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, Star, DollarSign, TrendingUp, Users, Award, 
  ExternalLink, Heart, Scale, Building2, BookOpen, GraduationCap, ArrowLeft, ThumbsUp 
} from "lucide-react";
import { useColleges } from "@/hooks/useColleges";
import { ReviewFormDialog } from "@/components/colleges/ReviewFormDialog";
import { CollegeQA } from "@/components/colleges/CollegeQA";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CollegeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getCollege, getReviews, getSavedColleges, toggleSaveCollege } = useColleges();
  
  const [college, setCollege] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const [reviewsData, setReviewsData] = useState<any>({ reviews: [], distribution: {} });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getCollege(id);
        setCollege(data);
        
        if (user) {
          const saved = await getSavedColleges();
          setIsSaved(saved.some((c: any) => (c._id || c) === id));
          
          // Track view for personalization
          const token = localStorage.getItem("token");
          if (token) {
            fetch(`${API_URL}/api/colleges/${id}/view`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
            }).catch(e => console.error("Error tracking view", e));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user]);

  const loadReviewPage = async (page: number) => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const data = await getReviews(id, page);
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

  const handleAddToCompare = () => {
    if (!college) return;
    const stored = sessionStorage.getItem("compareList");
    let current = stored ? JSON.parse(stored) : [];
    if (!current.some((c: any) => c._id === college._id)) {
      if (current.length < 4) {
        current.push(college);
        sessionStorage.setItem("compareList", JSON.stringify(current));
        // You might want to use a context or custom event to notify CompareBar, 
        // or just redirect to Compare page or Insights page.
        window.dispatchEvent(new Event("storage"));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-64 w-full bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-16 relative z-10 space-y-8">
          <Skeleton className="h-32 w-32 rounded-xl" />
          <Skeleton className="h-10 w-1/3" />
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

  const bannerImg = college.images?.[0] || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Banner */}
      <div className="h-64 md:h-80 w-full relative">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img src={bannerImg} alt={college.name} className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20 flex-1 mb-16">
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

          <div className="flex shrink-0 gap-3 w-full md:w-auto mt-4 md:mt-0">
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
            {["Overview", "Courses & Fees", "Placements", "Facilities", "Reviews", "Q&A"].map((tab) => (
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
                <CardHeader><CardTitle>Fee Structure</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Tuition Fee</span>
                    <span className="font-medium">₹{(college.fees.tuition).toLocaleString()}/yr</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Hostel Fee</span>
                    <span className="font-medium">₹{(college.fees.hostel).toLocaleString()}/yr</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Other Fees</span>
                    <span className="font-medium">₹{(college.fees.other).toLocaleString()}/yr</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{(college.fees.tuition + college.fees.hostel + college.fees.other).toLocaleString()}/yr
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="placements" className="space-y-6 animate-in fade-in duration-500">
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
                        <Star key={s} className={`h-5 w-5 ${s <= (college.rating||0) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
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

                  <div className="pt-4 border-t border-border">
                    <ReviewFormDialog collegeId={college._id} onSuccess={() => loadReviewPage(1)} />
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="md:col-span-2 space-y-6">
                <h3 className="text-xl font-bold">Student Reviews</h3>
                
                {loadingReviews ? (
                  <Skeleton className="h-40 w-full" />
                ) : reviewsData.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.reviews.map((review: any) => (
                      <Card key={review._id} className="border-border">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {review.userId?.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {review.userId?.full_name || 'Anonymous User'}
                                  {review.isVerified && <Badge variant="secondary" className="text-[10px] h-4">Verified</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {review.courseStudied && `${review.courseStudied} • `}
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded text-sm font-bold">
                              {review.rating} <Star className="h-3 w-3 fill-warning" />
                            </div>
                          </div>
                          
                          <h4 className="font-bold mb-2">{review.title}</h4>
                          <p className="text-muted-foreground text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                            {review.reviewText}
                          </p>
                          
                          {(review.pros || review.cons) && (
                            <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm bg-muted/20 p-3 rounded-lg border border-border">
                              {review.pros && (
                                <div>
                                  <span className="font-semibold text-green-500 block mb-1">Pros</span>
                                  <span className="text-muted-foreground">{review.pros}</span>
                                </div>
                              )}
                              {review.cons && (
                                <div>
                                  <span className="font-semibold text-red-500 block mb-1">Cons</span>
                                  <span className="text-muted-foreground">{review.cons}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                            <span className="text-xs text-muted-foreground">Was this helpful?</span>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleHelpful(review._id)}>
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
              <h3 className="text-xl font-bold mb-6">Questions & Answers</h3>
              <CollegeQA collegeId={college._id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CollegeDetail;
