import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, MapPin, DollarSign, Heart, MessageSquare, Zap, Clock, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface LifestylePreferences {
  cleanliness: string;
  sleepSchedule: string;
  noiseTolerance: string;
  smoking: string;
  pets: string;
}

interface RoommateMatch {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  preferredLocations: string[];
  lifestyle_preferences: LifestylePreferences;
  budgetRange: { min: number; max: number };
  moveInDate: string;
  bio?: string;
  compatibilityScore: number;
}

const RoommateFind = () => {
  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/roommates/discover`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        } else {
          toast({ title: "Profile Required", description: "Please complete your roommate profile to see matches.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Error fetching matches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Home className="mr-1 h-3 w-3" />
                  Find Roommates
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Find Your{" "}
                  <span className="text-foreground display-font">
                    Perfect Match
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Connect with compatible roommates based on preferences and lifestyle.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">No matches found. Ensure your profile is fully filled out!</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((profile, index) => (
              <ScrollReveal key={profile._id} delay={0.1 * (index + 1)}>
                <Card className="hover-scale border-primary/20 bg-card">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {profile.user.profilePicture && <AvatarImage src={profile.user.profilePicture} alt={profile.user.name} />}
                        <AvatarFallback className="bg-primary text-primary-foreground text-white text-lg font-bold">
                          {profile.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-bold line-clamp-1">{profile.user.name}</h3>
                          <Badge variant={profile.compatibilityScore >= 80 ? "default" : "secondary"} className="shrink-0 ml-2">
                            {profile.compatibilityScore}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          Move in: {new Date(profile.moveInDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] italic">"{profile.bio}"</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 text-sm bg-secondary/10 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium">${profile.budgetRange.min} - ${profile.budgetRange.max}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate" title={profile.preferredLocations.join(', ')}>
                          {profile.preferredLocations.length > 0 ? profile.preferredLocations[0] : 'Open'}
                          {profile.preferredLocations.length > 1 && ` +${profile.preferredLocations.length - 1}`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lifestyle</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs bg-background">
                          <Sparkles className="w-3 h-3 mr-1 text-blue-500" /> {profile.lifestyle_preferences.cleanliness}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-background">
                          <Clock className="w-3 h-3 mr-1 text-yellow-500" /> {profile.lifestyle_preferences.sleepSchedule}
                        </Badge>
                        {profile.lifestyle_preferences.smoking === 'No' && (
                          <Badge variant="outline" className="text-xs bg-background">No Smoking</Badge>
                        )}
                        {profile.lifestyle_preferences.pets !== 'No' && (
                          <Badge variant="outline" className="text-xs bg-background">{profile.lifestyle_preferences.pets}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 pt-0">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 group hover:border-red-500 hover:text-red-500">
                      <Heart className="h-4 w-4 group-hover:fill-current" /> Save
                    </Button>
                    <Button size="sm" className="flex-1 gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Connect
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoommateFind;
