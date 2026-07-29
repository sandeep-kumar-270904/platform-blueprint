import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export const RecommendedCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const res = await fetch(`${API_URL}/api/courses/recommendations`, { headers });
        if (res.ok) {
          const data = await res.json();
          setCourses(data.recommendedCourses || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading || courses.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-lg">Recommended Courses</h3>
        </div>
        <Link to="/courses">
          <span className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
            Browse All <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {courses.slice(0, 4).map((course, i) => (
          <ScrollReveal key={course._id} delay={i * 0.1}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full overflow-hidden" onClick={() => navigate(`/courses/${course._id}`)}>
              <div className="aspect-video bg-muted relative">
                {course.thumbnailImage ? (
                  <img src={course.thumbnailImage} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                    <BookOpen className="h-8 w-8 opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold uppercase">
                  Course
                </div>
              </div>
              <CardContent className="p-4 flex flex-col flex-1">
                <div className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider line-clamp-1">{course.category}</div>
                <h3 className="font-bold text-sm mb-2 line-clamp-2">{course.title}</h3>
                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground">
                  {course.provider && <span className="line-clamp-1">By {course.provider}</span>}
                  <span className="capitalize shrink-0">{course.level || 'All Levels'}</span>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
};
