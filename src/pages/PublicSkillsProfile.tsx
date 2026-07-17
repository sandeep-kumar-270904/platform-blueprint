import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Lock, Flame, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/layout/Header";

export default function PublicSkillsProfile() {
  const { userId } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['skills-profile', userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${userId}/skills-profile`);
      if (!res.ok) {
        if (res.status === 403) throw new Error("Private");
        throw new Error("Not Found");
      }
      return res.json();
    },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl space-y-8">
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
          <EmptyState 
            icon={Lock}
            title="Profile is Private"
            description="This user has not made their skills profile public."
          />
        </main>
      </div>
    );
  }

  const { full_name, avatar_url, learningStreak, skills, totalCertificates } = data;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl flex-grow">
        
        {/* Profile Header */}
        <div className="bg-card/60 backdrop-blur border border-border/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm mb-8">
          <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
            <AvatarImage src={avatar_url} />
            <AvatarFallback className="text-2xl">{full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          
          <div className="text-center md:text-left flex-grow space-y-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{full_name}'s Verified Skills</h1>
              <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-1 mt-1">
                <ShieldCheck className="h-4 w-4 text-primary" /> Officially verified learning records
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-blue-100 text-blue-700 border-blue-200">
                <Award className="h-4 w-4" />
                {totalCertificates} Certificates Earned
              </Badge>
              
              {learningStreak && learningStreak.longest > 0 && (
                <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-orange-100 text-orange-700 border-orange-200">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {learningStreak.longest} Day Max Streak
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">Verified Competencies</h2>
          
          {!skills || skills.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-8">No verified skills yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {skills.map((skill: any, idx: number) => (
                <Card key={idx} className="bg-card/40 border-border/50 shadow-none hover:shadow-sm transition-all overflow-hidden flex flex-col">
                  <CardHeader className="bg-muted/20 pb-4">
                    <CardTitle className="flex items-center justify-between text-lg">
                      {skill.skillName}
                      <Badge variant="outline" className="font-normal text-xs bg-background">
                        {skill.sourceCourses?.length || 0} Course{(skill.sourceCourses?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex-grow space-y-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Backed By</p>
                    {skill.sourceCourses?.map((course: any) => (
                      <div key={course._id} className="flex items-center gap-3 text-sm">
                        {course.thumbnailImage ? (
                          <div className="h-8 w-8 rounded overflow-hidden shrink-0 bg-muted">
                            <img src={course.thumbnailImage} alt={course.title} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded shrink-0 bg-muted flex items-center justify-center">
                            <Award className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{course.provider}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
      </main>
      
      {/* Footer Branding */}
      <footer className="mt-12 border-t py-6 text-center text-sm text-muted-foreground bg-muted/20">
        <p>Verified by <strong>College Connect</strong></p>
      </footer>
    </div>
  );
}
