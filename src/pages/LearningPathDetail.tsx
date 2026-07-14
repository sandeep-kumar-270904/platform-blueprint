import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  BookOpen, Clock, Users, Layers, ArrowLeft, CheckCircle, Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

const LearningPathDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: path, isLoading: pathLoading } = useQuery({
    queryKey: ['learning-path', id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/learning-paths/${id}`);
      if (!res.ok) throw new Error('Failed to fetch path');
      return res.json();
    }
  });

  const { data: myPaths } = useQuery({
    queryKey: ['my-paths'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me/learning-paths`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user paths');
      return res.json();
    },
    enabled: !!user
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/learning-paths/${id}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to enroll');
      return res.json();
    },
    onSuccess: () => {
      toast.success("Successfully enrolled in path and all its courses!");
      queryClient.invalidateQueries({ queryKey: ['my-paths'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] }); // Re-fetch courses so they show as enrolled
    },
    onError: () => toast.error("Failed to enroll")
  });

  if (pathLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-64 w-full mb-12" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Learning Path not found</h2>
          <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  const enrollment = myPaths?.find((p: any) => p.path._id === id || p.path === id);
  const isEnrolled = !!enrollment;
  const progressPercent = enrollment?.progressPercent || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 opacity-20">
          <img src={path.thumbnailImage} alt="background" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <Button variant="ghost" className="mb-6 -ml-4 text-muted hover:text-white" onClick={() => navigate('/courses')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
          </Button>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-primary hover:bg-primary/90 text-white">{path.category}</Badge>
              <Badge variant="outline" className="text-background border-background/50">{path.level}</Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{path.title}</h1>
            <div className="flex items-center gap-2 text-xl font-medium text-primary mb-6">
              <Target className="h-6 w-6" />
              {path.goal}
            </div>
            <p className="text-lg text-muted/80 mb-8">
              {path.description}
            </p>

            <div className="flex items-center gap-6 text-sm mb-8">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>{path.courseIds?.length || 0} Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{path.estimatedDuration} Total</span>
              </div>
            </div>

            {!user ? (
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/auth')}>
                Log in to Enroll in Path
              </Button>
            ) : !isEnrolled ? (
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? "Enrolling..." : "Enroll in Path"}
              </Button>
            ) : (
              <div className="bg-background/10 backdrop-blur-md rounded-lg p-4 border border-background/20 max-w-md">
                <div className="flex justify-between items-center text-sm font-medium mb-2">
                  <span className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-4 w-4" /> Enrolled
                  </span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-background/20" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h2 className="text-2xl font-bold mb-8">Courses in this Path</h2>
        
        <div className="space-y-4">
          {path.courseIds?.map((course: any, idx: number) => (
            <Card key={course._id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-0 flex flex-col sm:flex-row">
                {course.thumbnailImage && (
                  <div className="w-full sm:w-48 h-32 shrink-0">
                    <img src={course.thumbnailImage} alt={course.title} className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none" />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Step {idx + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">{course.duration}</Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{course.provider}</p>
                  
                  <Button asChild variant="outline" size="sm" className="w-max">
                    <Link to={`/courses/${course._id}`}>
                      View Course Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningPathDetail;
