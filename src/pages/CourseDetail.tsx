import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  BookOpen, Clock, Users, Star, Award, CheckCircle, 
  ExternalLink, Layers, ArrowLeft, PlayCircle, Download
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${id}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    }
  });

  const { data: paths } = useQuery({
    queryKey: ['course-paths', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${id}/paths`);
      if (!res.ok) throw new Error('Failed to fetch paths');
      return res.json();
    }
  });

  const { data: enrollments } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me/courses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    },
    enabled: !!user
  });

  const { data: ratingsData, isLoading: ratingsLoading } = useQuery({
    queryKey: ['course-ratings', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${id}/ratings`);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      return res.json();
    }
  });

  // For similar courses, we fetch same category
  const { data: similarData } = useQuery({
    queryKey: ['courses-similar', course?.category],
    queryFn: async () => {
      if (!course?.category) return { courses: [] };
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses?category=${encodeURIComponent(course.category)}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch similar courses');
      return res.json();
    },
    enabled: !!course?.category
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${id}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to enroll');
      return res.json();
    },
    onSuccess: () => {
      toast.success("Successfully enrolled!");
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
    onError: () => toast.error("Failed to enroll")
  });

  const progressMutation = useMutation({
    mutationFn: async (percent: number) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${id}/progress`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ progressPercent: percent })
      });
      if (!res.ok) throw new Error('Failed to update progress');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.progressPercent === 100) {
        toast.success("Congratulations! You completed the course!");
      } else {
        toast.success("Progress updated!");
      }
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
    }
  });

  const handleDownloadCertificate = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${id}/certificate`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to generate certificate");
      }
      const data = await res.json();
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html || data); 
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Could not download certificate");
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  // Find if user is enrolled
  let enrollmentStatus = null;
  let progressPercent = 0;
  
  if (enrollments) {
    const allEnrolled = [...enrollments.enrolled, ...enrollments.in_progress, ...enrollments.completed];
    const match = allEnrolled.find((e: any) => e.courseId._id === id || e.courseId === id);
    if (match) {
      enrollmentStatus = match.status;
      progressPercent = match.progressPercent;
    }
  }

  const similarCourses = similarData?.courses?.filter((c: any) => c._id !== id).slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground" onClick={() => navigate('/courses')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
          </Button>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                {paths && paths.map((path: any) => (
                  <Badge key={path._id} variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => navigate(`/learning-paths/${path._id}`)}>
                    <Layers className="mr-1 h-3 w-3" /> Part of: {path.title}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-warning text-warning" />
                  <span className="font-bold text-foreground text-base">{course.rating?.toFixed(1) || "New"}</span>
                  <span>({course.totalRatings || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{course.totalEnrollments || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Provider: <strong className="text-foreground">{course.provider}</strong></span>
                </div>
                {course.instructor && (
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    <span>Instructor: <strong className="text-foreground">{course.instructor}</strong></span>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:block relative rounded-xl overflow-hidden shadow-lg border">
              {course.thumbnailImage ? (
                <img src={course.thumbnailImage} alt={course.title} className="w-full h-auto object-cover aspect-video" />
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Syllabus */}
            {course.syllabus && course.syllabus.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>
                <div className="space-y-4">
                  {course.syllabus.map((item: string, idx: number) => (
                    <Card key={idx} className="bg-card/50">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold">
                          {idx + 1}
                        </div>
                        <div className="pt-1">
                          <h4 className="font-medium">{item}</h4>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Skills you will gain</h2>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="px-3 py-1 text-sm">{tag}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Ratings & Reviews */}
            <section className="pt-8 border-t">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Student Reviews</h2>
                {enrollmentStatus && (
                  <Button variant="outline" size="sm">Write a Review</Button>
                )}
              </div>
              
              {ratingsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : !ratingsData?.ratings || ratingsData.ratings.length === 0 ? (
                <div className="text-center p-8 bg-muted/30 rounded-lg border">
                  <p className="text-muted-foreground">No reviews yet for this course.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratingsData.ratings.map((review: any) => (
                    <Card key={review._id}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar>
                            <AvatarImage src={review.userId?.profileImage} />
                            <AvatarFallback>{review.userId?.name?.charAt(0) || 'S'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{review.userId?.name || 'Anonymous'}</p>
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(star => (
                                <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{review.reviewText}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div>
            <div className="sticky top-24 space-y-6">
              
              {/* Enrollment Card */}
              <Card className="border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold">
                    {course.price === 0 ? "Free" : `$${course.price}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {!user ? (
                    <Button className="w-full" size="lg" onClick={() => navigate('/auth')}>
                      Log in to Enroll
                    </Button>
                  ) : !enrollmentStatus ? (
                    <Button 
                      className="w-full gap-2" 
                      size="lg" 
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  ) : (
                    <div className="space-y-5 p-5 bg-muted/30 rounded-xl border">
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-primary flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" /> 
                          {progressPercent === 100 ? "Completed" : "Enrolled"}
                        </span>
                        <span className="font-bold">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2.5" />
                      
                      <div className="space-y-3 pt-2">
                        <Button 
                          className="w-full gap-2"
                          onClick={() => window.open(course.externalUrl, '_blank')}
                        >
                          Go to Course Content <ExternalLink className="h-4 w-4" />
                        </Button>
                        
                        {progressPercent < 100 ? (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 text-xs"
                              onClick={() => progressMutation.mutate(Math.min(progressPercent + 25, 99))}
                              disabled={progressMutation.isPending}
                            >
                              +25% Progress
                            </Button>
                            <Button 
                              variant="default" 
                              className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => progressMutation.mutate(100)}
                              disabled={progressMutation.isPending}
                            >
                              Mark Complete
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full border-green-200 bg-green-50/50 text-green-700 hover:bg-green-100 hover:text-green-800 gap-2"
                            onClick={handleDownloadCertificate}
                          >
                            <Download className="h-4 w-4" /> Download Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t text-sm">
                    <div className="flex items-center gap-3">
                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Learn at your own pace</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>Platform Certificate of Completion</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span>Content hosted on {course.provider}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>

        {/* Similar Courses */}
        {similarCourses.length > 0 && (
          <section className="mt-20 pt-10 border-t">
            <h2 className="text-2xl font-bold mb-6">Similar Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarCourses.map((similar: any) => (
                <Link key={similar._id} to={`/courses/${similar._id}`} className="block group">
                  <Card className="h-full hover:border-primary/50 transition-colors bg-muted/20">
                    <CardContent className="p-4 flex gap-4 items-center">
                      {similar.thumbnailImage ? (
                        <div className="w-16 h-16 shrink-0 rounded overflow-hidden">
                          <img src={similar.thumbnailImage} alt={similar.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 shrink-0 rounded bg-background flex items-center justify-center border">
                          <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{similar.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{similar.level}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            {similar.rating?.toFixed(1) || "New"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
