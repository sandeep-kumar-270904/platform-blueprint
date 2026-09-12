import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export const OpportunityMappingCard = ({ technology }: { technology: string }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ jobs: 0, internships: 0 });

  useEffect(() => {
    // In a real app, we'd hit /api/jobs/count?search=technology
    // For now, we simulate finding opportunities based on the tech tag
    const fetchOpportunities = async () => {
      setLoading(true);
      try {
        // Mocking the API response for opportunities matching the tech
        await new Promise(r => setTimeout(r, 800));
        
        // Random deterministic numbers based on tech string length
        const base = technology.length;
        setStats({
          jobs: base * 2 + Math.floor(Math.random() * 5),
          internships: base + Math.floor(Math.random() * 3)
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (technology) {
      fetchOpportunities();
    } else {
      setLoading(false);
    }
  }, [technology]);

  if (!technology) return null;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          Why Learn {technology}?
        </CardTitle>
        <CardDescription>Career Opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Mastering <strong>{technology}</strong> matches the requirements for active positions on Student Hub.
            </p>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-primary">{stats.jobs} Jobs</Badge>
              <Badge variant="secondary">{stats.internships} Internships</Badge>
            </div>
            <Link 
              to={`/placement/search?q=${encodeURIComponent(technology)}`}
              className="text-sm text-primary font-medium flex items-center hover:underline pt-2"
            >
              View Opportunities <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
