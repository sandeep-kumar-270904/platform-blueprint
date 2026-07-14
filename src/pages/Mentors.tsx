import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingModal } from "@/components/BookingModal";
import { MentorAMA } from "@/components/mentors/MentorAMA";
import { useMentors, useMentorAvailability, type MentorRow, type AvailabilitySlot } from "@/hooks/useMentors";
import { Users, Star, CheckCircle2, Search, Calendar as CalendarIcon, Video, Award, Clock, DollarSign, Globe, Mic, Loader2 } from "lucide-react";

const Mentors = () => {
  const { mentors, loading } = useMentors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<MentorRow | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [pickedSlot, setPickedSlot] = useState<AvailabilitySlot | null>(null);
  const { slots } = useMentorAvailability(selectedMentor?.id || null);

  const allExpertise = useMemo(() => Array.from(new Set(mentors.flatMap((m) => m.expertise))), [mentors]);

  const filtered = mentors.filter((m) => {
    const name = (m.profile?.full_name || m.profile?.username || "").toLowerCase();
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesExp = !selectedExpertise || m.expertise.includes(selectedExpertise);
    return matchesSearch && matchesExp;
  });

  const initials = (m: MentorRow) => (m.profile?.full_name || m.profile?.username || "M").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const dateKey = selectedDate?.toISOString().split("T")[0];
  const availableSlots = slots.filter((s) => !s.is_booked && s.starts_at.startsWith(dateKey || ""));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-6 md:py-10">
          <div className="container mx-auto px-4 relative z-8">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-5xl text-center">
                <Badge variant="accent" className="mb-4"><Users className="mr-1 h-3 w-3" />Connect with Industry Experts</Badge>
                <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Learn from the <span className="text-foreground display-font">Best Mentors</span></h1>
                <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">Get personalized guidance from experienced professionals. Book real 1-on-1 sessions today.</p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="mentors" className="space-y-8">
          <TabsList className="bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="mentors"><Users className="mr-2 h-4 w-4" />Browse Mentors</TabsTrigger>
            <TabsTrigger value="ama"><Mic className="mr-2 h-4 w-4" />AMA Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="mentors" className="space-y-8">
            <div className="space-y-4">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, role, or expertise..." className="pl-10 bg-card/50" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={selectedExpertise === null ? "default" : "outline"} size="sm" onClick={() => setSelectedExpertise(null)}>All Skills</Button>
                {allExpertise.slice(0, 10).map((e) => (
                  <Button key={e} variant={selectedExpertise === e ? "default" : "outline"} size="sm" onClick={() => setSelectedExpertise(e)}>{e}</Button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[{ icon: Users, label: "Mentors", value: mentors.length }, { icon: Video, label: "Sessions", value: mentors.reduce((s, m) => s + m.sessions_count, 0) }, { icon: Award, label: "Reviews", value: mentors.reduce((s, m) => s + m.reviews_count, 0) }].map((stat, i) => (
                <Card key={i} className="bg-card/50 border-primary/20">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20"><stat.icon className="h-6 w-6 text-primary" /></div>
                    <div><div className="text-2xl font-bold">{stat.value}</div><div className="text-sm text-muted-foreground">{stat.label}</div></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No mentors yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to create a mentor profile.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((mentor, idx) => (
                  <ScrollReveal key={mentor.id} delay={idx * 0.05} direction="scale">
                    <Card className="card-hover bg-card/50 border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                            <AvatarImage src={mentor.profile?.avatar_url || ""} />
                            <AvatarFallback className="text-lg bg-primary text-primary-foreground text-primary-foreground">{initials(mentor)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{mentor.profile?.full_name || mentor.profile?.username || "Mentor"}</h3>
                              {mentor.verified && <CheckCircle2 className="h-4 w-4 text-accent" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{mentor.title}</p>
                            {mentor.company && <p className="text-sm font-medium text-primary">{mentor.company}</p>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /><span className="font-medium">{Number(mentor.rating).toFixed(1)}</span><span className="text-muted-foreground">({mentor.reviews_count})</span></div>
                          <div className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" /><span>{mentor.sessions_count} sessions</span></div>
                        </div>
                        {mentor.bio && <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>}
                        <div className="flex flex-wrap gap-2">
                          {mentor.expertise.slice(0, 3).map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                          {mentor.expertise.length > 3 && <Badge variant="outline" className="text-xs">+{mentor.expertise.length - 3}</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {mentor.availability_text && <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{mentor.availability_text}</span></div>}
                          <div className="flex items-center gap-1"><DollarSign className="h-4 w-4" /><span>₹{mentor.price_per_hour}/hr</span></div>
                        </div>
                        {mentor.languages.length > 0 && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">{mentor.languages.join(", ")}</span></div>}
                      </CardContent>
                      <CardFooter className="pt-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="w-full" onClick={() => setSelectedMentor(mentor)}><CalendarIcon className="mr-2 h-4 w-4" />Book Session</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Book a Session with {mentor.profile?.full_name || mentor.profile?.username}</DialogTitle></DialogHeader>
                            <div className="space-y-6">
                              <div>
                                <h4 className="mb-3 font-medium">Select Date</h4>
                                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || d > new Date(Date.now() + 30 * 86400000)} className="rounded-lg border" />
                              </div>
                              <div>
                                <h4 className="mb-3 font-medium">Available Slots</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {availableSlots.length > 0 ? availableSlots.map((slot) => (
                                    <Button key={slot.id} variant="outline" size="sm" onClick={() => { setPickedSlot(slot); setBookingOpen(true); }}>
                                      {new Date(slot.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </Button>
                                  )) : <p className="col-span-3 text-sm text-muted-foreground text-center py-4">No slots for this date.</p>}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ama"><MentorAMA /></TabsContent>
        </Tabs>
      </div>

      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} mentor={selectedMentor} slot={pickedSlot} />
    </div>
  );
};

export default Mentors;
