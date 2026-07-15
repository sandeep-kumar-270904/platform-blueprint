import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Layers, CheckCircle, Clock, Download, Award, Flame, Share2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export const MyCourses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me/courses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    }
  });

  const { data: myPaths, isLoading: pathsLoading } = useQuery({
    queryKey: ['my-paths'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me/learning-paths`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user paths');
      return res.json();
    }
  });

  const handleDownloadCertificate = async (id: string) => {
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

  const privacyMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me/skills-privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ skillsProfilePublic: isPublic })
      });
      if (!res.ok) throw new Error('Failed to update privacy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      toast.success("Privacy settings updated");
    },
    onError: () => {
      toast.error("Failed to update privacy settings");
    }
  });

  const handleCopyLink = () => {
    if (!enrollments?.skillsProfilePublic) {
      toast.error("Enable your public profile first to share credentials!");
      return;
    }
    const url = `${window.location.origin}/profile/${user?._id}/skills`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied to clipboard!");
  };

  const inProgressCourses = enrollments ? [...enrollments.enrolled, ...enrollments.in_progress] : [];
  const completedCourses = enrollments ? [...enrollments.completed] : [];
  const skillsProfilePublic = enrollments?.skillsProfilePublic || false;
  const skills = enrollments?.skills || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">My Learning</h2>
            {enrollments?.learningStreak && enrollments.learningStreak.current > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 gap-1 font-bold">
                <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                {enrollments.learningStreak.current} Day Streak
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Track your progress across courses and learning paths.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/courses">Browse Catalog</Link>
        </Button>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Individual Courses</TabsTrigger>
          <TabsTrigger value="paths">My Learning Paths</TabsTrigger>
          <TabsTrigger value="skills">Skills Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-0 space-y-8">
          {coursesLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Card key={i}><CardContent className="h-32"><Skeleton className="h-full w-full" /></CardContent></Card>)}
            </div>
          ) : (
            <>
              {/* In Progress Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <Clock className="h-5 w-5 text-primary" /> In Progress ({inProgressCourses.length})
                </h3>
                {inProgressCourses.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">No courses in progress.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {inProgressCourses.map((e: any) => (
                      <Card key={e._id} className="flex flex-col hover:border-primary/50 transition-colors">
                        <CardContent className="p-4 flex gap-4">
                          {e.courseId.thumbnailImage ? (
                            <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
                              <img src={e.courseId.thumbnailImage} alt={e.courseId.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-24 h-24 shrink-0 rounded-md bg-muted flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex flex-col justify-between flex-grow overflow-hidden">
                            <div>
                              <h4 className="font-bold text-sm truncate">{e.courseId.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{e.courseId.provider}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>In Progress</span>
                                <span>{e.progressPercent}%</span>
                              </div>
                              <Progress value={e.progressPercent} className="h-1.5" />
                              {e.daysSinceUpdate !== undefined && e.daysSinceUpdate > 0 && (
                                <p className={`text-[10px] mt-1 ${e.isStalled ? 'text-amber-600/80 italic' : 'text-muted-foreground'}`}>
                                  {e.isStalled ? 'Stalled · ' : ''}last updated {e.daysSinceUpdate} day{e.daysSinceUpdate === 1 ? '' : 's'} ago
                                </p>
                              )}
                            </div>
                            <Link to={`/courses/${e.courseId._id}`} className="text-xs text-primary hover:underline font-medium mt-1 inline-block">
                              Continue Course →
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Completed ({completedCourses.length})
                </h3>
                {completedCourses.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">You haven't completed any courses yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {completedCourses.map((e: any) => (
                      <Card key={e._id} className="flex flex-col bg-muted/10 border-green-500/20">
                        <CardContent className="p-4 flex gap-4">
                          {e.courseId.thumbnailImage ? (
                            <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-muted relative">
                              <div className="absolute inset-0 bg-green-500/20 mix-blend-multiply" />
                              <img src={e.courseId.thumbnailImage} alt={e.courseId.title} className="w-full h-full object-cover grayscale-[30%]" />
                            </div>
                          ) : (
                            <div className="w-24 h-24 shrink-0 rounded-md bg-muted flex items-center justify-center">
                              <Award className="h-8 w-8 text-green-500/50" />
                            </div>
                          )}
                          <div className="flex flex-col justify-between flex-grow overflow-hidden">
                            <div>
                              <h4 className="font-bold text-sm truncate">{e.courseId.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{e.courseId.provider}</p>
                            </div>
                            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs px-2 flex-1 gap-1 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                onClick={() => handleDownloadCertificate(e.courseId._id)}
                              >
                                <Download className="h-3 w-3" /> Certificate
                              </Button>
                              <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2 flex-1">
                                <Link to={`/courses/${e.courseId._id}`}>View Details</Link>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs px-2 flex-1 gap-1"
                                onClick={handleCopyLink}
                              >
                                <Share2 className="h-3 w-3" /> Share
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="paths" className="mt-0 space-y-4">
          {pathsLoading ? (
             <div className="grid md:grid-cols-2 gap-4">
               {[1,2].map(i => <Card key={i}><CardContent className="h-40 flex items-center justify-center"><Skeleton className="h-full w-full" /></CardContent></Card>)}
             </div>
          ) : !myPaths || myPaths.length === 0 ? (
            <EmptyState icon={Layers} title="No Paths Enrolled" description="You haven't enrolled in any learning paths yet." />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {myPaths.map((enrollment: any) => (
                <Card key={enrollment._id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold line-clamp-1">{enrollment.path.title}</CardTitle>
                    <Badge variant="outline">{enrollment.path.category}</Badge>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col pt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-muted-foreground font-medium">Progress</span>
                      <span className="font-bold">{enrollment.progressPercent}%</span>
                    </div>
                    <Progress value={enrollment.progressPercent} className="h-2 mb-4" />
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{enrollment.completedCourses} / {enrollment.totalCourses} completed</span>
                      </div>
                    </div>

                    <Button asChild variant="secondary" className="w-full mt-auto">
                      <Link to={`/learning-paths/${enrollment.path._id}`}>Continue Learning</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="mt-0 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile-toggle" className="text-base">Public Skills Profile</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to view your verified skills and certificates.
              </p>
            </div>
            <Switch 
              id="public-profile-toggle" 
              checked={skillsProfilePublic}
              onCheckedChange={(checked) => privacyMutation.mutate(checked)}
              disabled={privacyMutation.isPending}
            />
          </div>

          {skillsProfilePublic && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-sm text-blue-800">
              <span className="truncate mr-4">Your public profile is live at: <strong>{window.location.origin}/profile/{user?._id}/skills</strong></span>
              <Button variant="outline" size="sm" className="bg-white hover:bg-gray-100" onClick={handleCopyLink}>
                Copy Link
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">My Verified Skills</h3>
            {skills.length === 0 ? (
              <EmptyState icon={Award} title="No Skills Yet" description="Complete courses to start building your verified skills profile." />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {skills.map((skill: any, idx: number) => (
                  <Card key={idx} className="bg-card/40 hover:shadow-sm transition-all overflow-hidden">
                    <CardHeader className="bg-muted/20 pb-3">
                      <CardTitle className="text-md flex items-center justify-between">
                        {skill.skillName}
                        <Badge variant="secondary" className="font-normal text-xs">
                          {skill.sourceCourses?.length || 0} Course{(skill.sourceCourses?.length || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-2">
                        {skill.sourceCourses?.map((course: any) => (
                          <div key={course._id} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span className="font-medium truncate">{course.title}</span>
                            <span className="text-muted-foreground truncate hidden sm:inline">- {course.provider}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
