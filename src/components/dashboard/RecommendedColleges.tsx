import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CollegeCard } from "@/components/colleges/CollegeCard";
import { Sparkles, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export const RecommendedColleges = () => {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const res = await fetch(`${API_URL}/api/colleges/personalization`, { headers });
        if (res.ok) {
          const data = await res.json();
          setColleges(data.recommended || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading || colleges.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-lg">Recommended For You</h3>
        </div>
        <Link to="/college-insights">
          <span className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
            Browse All <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {colleges.slice(0, 4).map((college, i) => (
          <ScrollReveal key={college._id} delay={i * 0.1}>
            <CollegeCard 
              college={{...college, id: college._id}} 
              isSaved={false} 
              onToggleCompare={() => {}} 
              compareMode={false} 
              isSelected={false}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
};
