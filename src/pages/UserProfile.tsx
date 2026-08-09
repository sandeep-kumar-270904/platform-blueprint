import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/community-feed/FollowButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, GraduationCap, MapPin, Edit3, Flame, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  
  // If no ID is provided, show the logged-in user's profile
  const isOwnProfile = !id || id === currentUser?._id;
  const profileId = id || currentUser?._id;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${profileId}/profile`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <Header />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h2 className="text-2xl font-bold">Profile not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-4">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-md">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || profile.username} />
                <AvatarFallback className="text-3xl bg-[var(--ink)] text-white">
                  {(profile.full_name || profile.username || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {isOwnProfile ? (
                <Link to="/settings" className="mt-4 sm:mt-0">
                  <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </div>
                </Link>
              ) : (
                <div className="mt-4 sm:mt-0">
                  <FollowButton targetId={profile._id || id} type="user" />
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold">{profile.full_name || profile.username}</h1>
              {profile.username && profile.full_name && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
              
              {(profile.role === 'admin' || profile.role === 'recruiter') && (
                <Badge variant="secondary" className="mt-2 capitalize">
                  {profile.role}
                </Badge>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                {profile.university && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {profile.university} {profile.graduation_year ? `'${String(profile.graduation_year).slice(-2)}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {profile.bio || (isOwnProfile ? "You haven't written a bio yet. Go to Settings to add one!" : "This user hasn't added a bio yet.")}
                </p>
                {profile.degree && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Degree</h4>
                    <p className="text-sm">{profile.degree}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.learningStreak?.current || 0}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.totalQuizPoints || 0}</p>
                    <p className="text-xs text-muted-foreground">Quiz Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm font-medium">
                        {skill.skillName || skill.skill || skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badges & Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.badges && profile.badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {profile.badges.map((badge: any, idx: number) => (
                      <div key={idx} className="flex flex-col items-center p-4 bg-muted/30 rounded-xl border text-center">
                        <Award className="h-8 w-8 text-primary mb-2" />
                        <span className="text-sm font-medium">{badge.badgeId || badge}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No badges earned yet. Participate in quizzes and discussions to earn badges!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
