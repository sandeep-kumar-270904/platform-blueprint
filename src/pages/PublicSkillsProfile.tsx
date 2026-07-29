import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Trophy, CheckCircle2, Lock, Flame, ShieldCheck, Star, Users } from "lucide-react";
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
              {data?.is_verified_host && (
                <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-indigo-100 text-indigo-700 border-indigo-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified Host
                </Badge>
              )}
              
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
            
            {data?.gamification_badges && data.gamification_badges.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center justify-center md:justify-start gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" /> Earned Badges
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {data.gamification_badges.map((badge: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center bg-muted/20 border rounded-lg p-2 min-w-[80px] text-center" title={badge.description}>
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <span className="text-[10px] font-bold line-clamp-1">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        
        <TeamHuntStatsSection userId={userId || ""} />
        <TeamReviewsSection userId={userId || ""} />

      </main>
      
      {/* Footer Branding */}
      <footer className="mt-12 border-t py-6 text-center text-sm text-muted-foreground bg-muted/20">
        <p>Verified by <strong>College Connect</strong></p>
      </footer>
    </div>
  );
}

function TeamReviewsSection({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['team-reviews', userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${userId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    }
  });

  if (isLoading) return null;
  const reviews = data?.data?.reviews || [];
  const stats = data?.data?.stats || { averageRating: 0, totalReviews: 0 };

  if (reviews.length === 0) return null;

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-xl font-bold">Team Hunt Reviews</h2>
        <Badge variant="secondary" className="text-sm">
          <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" />
          {stats.averageRating} ({stats.totalReviews} reviews)
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {reviews.map((review: any) => (
          <Card key={review._id} className="bg-card/40 border-border/50 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.reviewer.avatar} />
                    <AvatarFallback>{review.reviewer.username?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{review.reviewer.full_name || review.reviewer.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">For <span className="font-medium">{review.team.title}</span></p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                  <span className="font-bold text-sm">{review.rating}</span>
                </div>
              </div>
            </CardHeader>
            {review.comment && (
              <CardContent>
                <p className="text-sm italic text-muted-foreground">"{review.comment}"</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeamHuntStatsSection({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['teamhunt-stats', userId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${userId}/teamhunt-stats`);
      if (!res.ok) throw new Error("Failed to fetch teamhunt stats");
      return res.json();
    }
  });

  if (isLoading || !data) return null;

  const { stats, badges } = data;

  if (stats.teamsCreated === 0 && stats.teamsJoined === 0) return null;

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-xl font-bold">Team Hunt Profile</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30 shadow-none border-dashed">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Users className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.teamsCreated}</p>
            <p className="text-xs text-muted-foreground uppercase">Teams Created</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 shadow-none border-dashed">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.teamsJoined}</p>
            <p className="text-xs text-muted-foreground uppercase">Teams Joined</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 shadow-none border-dashed">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Trophy className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.teamsCompleted}</p>
            <p className="text-xs text-muted-foreground uppercase">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 shadow-none border-dashed">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Star className="h-6 w-6 mb-2 text-yellow-500 fill-yellow-500" />
            <p className="text-2xl font-bold">{stats.averageRatingReceived > 0 ? stats.averageRatingReceived.toFixed(1) : '-'}</p>
            <p className="text-xs text-muted-foreground uppercase">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {badges && badges.length > 0 && (
        <div className="mt-4 pt-4">
          <p className="text-sm font-semibold mb-3">Team Hunt Badges</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b: any) => (
              <Badge key={b.badge_id} variant="secondary" className="px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">
                <Trophy className="h-3 w-3 mr-1.5" />
                {b.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
