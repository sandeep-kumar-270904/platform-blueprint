import React, { useEffect, useState } from 'react';
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Award, Briefcase, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export const SuccessStoriesPage = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/success-stories/public`);
      if (res.ok) setStories(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="accent" className="mb-4"><Award className="h-4 w-4 mr-1" /> Alumni Success</Badge>
          <h1 className="text-4xl font-bold mb-4">Success Stories</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how our platform has helped students land their dream jobs, and learn from their winning resumes.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map(story => (
              <Card key={story._id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{story.title}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{story.roleTitle} @ {story.companyLanded}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm flex-1 whitespace-pre-wrap">{story.narrative}</p>
                  
                  {story.linkedResumeId && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Winning Resume</p>
                      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                        <span className="text-sm font-medium">{story.linkedResumeId.title}</span>
                        {story.linkedResumeId.showAtsScore && story.linkedResumeId.atsScore && (
                          <Badge variant="default">{story.linkedResumeId.atsScore.score} ATS</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {story.linkedPortfolioSlug && (
                    <div className="mt-2 text-right">
                      <Link to={`/portfolio/${story.linkedPortfolioSlug}`} className="text-sm text-primary hover:underline flex items-center justify-end">
                        View Portfolio <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {stories.length === 0 && (
              <div className="col-span-full text-center py-20 border-2 border-dashed rounded-xl">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">No Stories Yet</h3>
                <p className="text-muted-foreground">Check back soon for inspiring success stories.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessStoriesPage;
