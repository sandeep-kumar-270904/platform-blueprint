import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Video, Calendar, Clock, Users, Loader2, Link2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AMASessionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/sessions`);
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (id: string) => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setBusy(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/amas/sessions/${id}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Registration failed", description: data.message, variant: "destructive" });
      } else {
        toast({ title: "You're registered! 🎉" });
        fetchSessions();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const past = sessions.filter((s) => s.status === "completed" || s.status === "cancelled");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden py-20 bg-muted/30">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge variant="default" className="mb-6"><Video className="mr-1 h-3 w-3" /> Mentor AMAs</Badge>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Ask Me Anything Sessions</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Join live group AMAs with top mentors. Register for free, ask questions, and learn from experts in real-time.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past / Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : upcoming.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No upcoming AMAs currently scheduled.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {upcoming.map((session, idx) => (
                  <ScrollReveal key={session._id} delay={0.1 * idx}>
                    <SessionCard session={session} user={user} busy={busy} onRegister={handleRegister} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : past.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No past AMAs found.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {past.map((session, idx) => (
                  <ScrollReveal key={session._id} delay={0.1 * idx}>
                    <SessionCard session={session} user={user} busy={busy} onRegister={handleRegister} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SessionCard({ session, user, busy, onRegister }: { session: any, user: any, busy: string | null, onRegister: (id: string) => void }) {
  const isRegistered = user && session.registered_attendees?.some((a: any) => a.user_id === user.id);
  const isHost = user && session.mentor_id === user.id;
  const isFull = session.participant_count >= session.max_participants;

  return (
    <Card className="hover-lift h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="secondary">{session.topic}</Badge>
          <Badge variant={session.status === 'upcoming' ? "default" : "outline"}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Badge>
        </div>
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{session.title}</h3>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.mentor_profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${session.mentor_profile?.full_name || 'M'}`} />
            <AvatarFallback>{session.mentor_profile?.full_name?.charAt(0) || 'M'}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium leading-none">{session.mentor_profile?.full_name || 'Mentor'}</p>
            <p className="text-muted-foreground text-xs mt-1">{session.mentor_meta?.title} @ {session.mentor_meta?.company}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{session.description}</p>
          
          <div className="bg-muted/30 p-3 rounded-md space-y-2 text-sm">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{new Date(session.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{session.duration_minutes} min</span></div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{session.participant_count} / {session.max_participants} registered</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t space-y-2">
          {session.status === 'upcoming' && !isHost && !isRegistered && (
            <Button 
              className="w-full" 
              variant="default" 
              disabled={busy === session._id || isFull} 
              onClick={() => onRegister(session._id)}
            >
              {busy === session._id ? <Loader2 className="h-4 w-4 animate-spin" /> : isFull ? "Session Full" : "Register for Free"}
            </Button>
          )}

          {session.status === 'upcoming' && (isHost || isRegistered) && (
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={() => window.location.href = `/mentors/amas/${session._id}`}
            >
              Enter Live Session Board
            </Button>
          )}

          {session.status === 'completed' && session.recording_url && (
            <Button asChild variant="outline" className="w-full">
              <a href={session.recording_url} target="_blank" rel="noreferrer"><Link2 className="mr-2 h-4 w-4"/> Watch Recording</a>
            </Button>
          )}

          {session.status === 'completed' && !session.recording_url && (
            <Button disabled variant="outline" className="w-full">Recording not available</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
