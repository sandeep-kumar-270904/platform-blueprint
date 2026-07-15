import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export const ResumeLearning = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInProgress = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const res = await fetch(`${API_URL}/api/users/me/courses`, { headers });
        if (res.ok) {
          const data = await res.json();
          // Filter to only those in progress
          const inProgress = (data.enrollments || []).filter((e: any) => e.progressPercent > 0 && e.progressPercent < 100);
          // Sort by recently updated
          inProgress.sort((a: any, b: any) => new Date(b.lastProgressUpdateAt || b.enrolledAt).getTime() - new Date(a.lastProgressUpdateAt || a.enrolledAt).getTime());
          setEnrollments(inProgress);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInProgress();
  }, []);

  if (loading || enrollments.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-lg">Resume Learning</h3>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {enrollments.slice(0, 3).map((enr, i) => (
          <ScrollReveal key={enr._id} delay={i * 0.1}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" onClick={() => navigate(`/courses/${enr.courseId._id}`)}>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">{enr.courseId.category}</div>
                  <h4 className="font-semibold line-clamp-2 mb-3">{enr.courseId.title}</h4>
                </div>
                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{enr.progressPercent}% Complete</span>
                  </div>
                  <Progress value={enr.progressPercent} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
};
