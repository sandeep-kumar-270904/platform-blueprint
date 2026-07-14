import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLearningSessions } from "@/hooks/useLearningSessions";
import { useToast } from "@/hooks/use-toast";
import { Video, Calendar, Clock, Users, Loader2 } from "lucide-react";

const Sessions = () => {
  const { user } = useAuth();
  const { sessions, loading, rsvp, cancelRsvp } = useLearningSessions(user?.id);
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [busy, setBusy] = useState<string | null>(null);

  const upcoming = sessions.filter((s) => s.status === "upcoming" || s.status === "live");
  const past = sessions.filter((s) => s.status === "ended");
  const list = selectedTab === "upcoming" ? upcoming : selectedTab === "past" ? past : sessions.filter((s) => s.recording_url);

  const handleAction = async (id: string, isRsvped: boolean) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setBusy(id);
    const err = isRsvped ? await cancelRsvp(id) : await rsvp(id);
    setBusy(null);
    if (err) toast({ title: "Action failed", description: err.message, variant: "destructive" });
    else toast({ title: isRsvped ? "RSVP cancelled" : "You're in! 🎉" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-8">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6"><Video className="mr-1 h-3 w-3" />Learning Sessions</Badge>
                <h1 className="mb-6 text-4xl font-bold md:text-6xl">Mentor & <span className="text-foreground display-font">Peer Sessions</span></h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">Live, interactive sessions hosted by mentors and peers across the community.</p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : list.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No sessions in this tab yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {list.map((session, idx) => (
                  <ScrollReveal key={session.id} delay={0.1 * idx}>
                    <Card className="hover-lift">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary">{session.session_type.replace("_", " ")}</Badge>
                          <Badge variant={session.status === "live" ? "default" : "outline"}>
                            {session.status === "live" ? "🔴 Live" : session.price > 0 ? `₹${session.price}` : "Free"}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{session.title}</h3>
                        <p className="text-sm text-muted-foreground">by {session.host_profile?.full_name || session.host_profile?.username || "Host"}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {session.description && <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{new Date(session.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
                            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{session.duration_minutes} min</span></div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{session.participant_count}/{session.max_participants} joined</span>
                          </div>
                          {session.status === "live" && session.video_link && session.is_rsvped ? (
                            <Button asChild className="w-full"><a href={session.video_link} target="_blank" rel="noreferrer"><Video className="mr-2 h-4 w-4" />Join Now</a></Button>
                          ) : session.recording_url && session.status === "ended" ? (
                            <Button asChild variant="outline" className="w-full"><a href={session.recording_url} target="_blank" rel="noreferrer">Watch Recording</a></Button>
                          ) : (
                            <Button className="w-full" variant={session.is_rsvped ? "secondary" : "default"} disabled={busy === session.id || session.status === "ended"} onClick={() => handleAction(session.id, !!session.is_rsvped)}>
                              {busy === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : session.is_rsvped ? "Cancel RSVP" : "RSVP"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sessions;
