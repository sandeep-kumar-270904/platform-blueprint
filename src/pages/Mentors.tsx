import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BookingModal } from "@/components/BookingModal";
import { MentorAMA } from "@/components/mentors/MentorAMA";
import { BecomeMentorModal } from "@/components/mentors/BecomeMentorModal";
import { useMentors, useMentorAvailability, useRecommendedMentors, type MentorRow, type AvailabilitySlot } from "@/hooks/useMentors";
import { Users, Star, CheckCircle2, Search, Calendar as CalendarIcon, Video, Award, Clock, DollarSign, Globe, Mic, Loader2, ArrowRight, Sparkles } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

const Mentors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  const { mentors, loading } = useMentors({
    search: debouncedSearch,
    expertise: selectedExpertise,
    verifiedOnly
  });
  
  const { mentors: recommended, loading: loadingRecommended } = useRecommendedMentors();

  const [allExpertise, setAllExpertise] = useState<string[]>([]);
  
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/tags`)
      .then(r => r.ok ? r.json() : [])
      .then(setAllExpertise)
      .catch(console.error);
  }, []);

  const [selectedMentor, setSelectedMentor] = useState<MentorRow | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [pickedSlot, setPickedSlot] = useState<AvailabilitySlot | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const { slots } = useMentorAvailability(selectedMentor?.id || null);

  const filtered = mentors; // Server already filtered it

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
                <Button onClick={() => setApplyModalOpen(true)} variant="outline" className="gap-2">
                  Become a Mentor <ArrowRight className="h-4 w-4" />
                </Button>
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
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-2 flex-1">
                  <Button variant={selectedExpertise === null ? "default" : "outline"} size="sm" onClick={() => setSelectedExpertise(null)}>All Skills</Button>
                  {allExpertise.slice(0, 10).map((e) => (
                    <Button key={e} variant={selectedExpertise === e ? "default" : "outline"} size="sm" onClick={() => setSelectedExpertise(e)}>{e}</Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 border bg-card/50 px-3 py-1.5 rounded-md">
                  <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                  <Label htmlFor="verified-only" className="cursor-pointer">Verified Only</Label>
                </div>
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
                <h3 className="font-semibold mb-2">
                  {searchQuery || selectedExpertise ? "No mentors match your search" : "No mentors yet"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || selectedExpertise ? "Try adjusting your filters or search terms." : "Be the first to create a mentor profile."}
                </p>
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
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">{mentor.title}</p>
                              {mentor.tier !== 'new' && (
                                <Badge variant="secondary" className="text-[10px] uppercase h-5 bg-primary/10 text-primary border-primary/20">{mentor.tier}</Badge>
                              )}
                              {mentor.verificationTier && mentor.verificationTier !== 'unverified' && (
                                <Badge variant="outline" className="text-[10px] capitalize h-5 bg-accent/10 text-accent border-accent/20">
                                  {mentor.verificationTier.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
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
                        <Button variant="default" size="sm" className="w-full" asChild>
                          <Link to={`/mentors/${mentor.id}`}><CalendarIcon className="mr-2 h-4 w-4" />View Profile & Book</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}
            
            {!loadingRecommended && recommended.length > 0 && !searchQuery && !selectedExpertise && (
              <div className="mt-12">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <h2 className="text-2xl font-bold">Recommended for You</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((mentor, idx) => (
                    <ScrollReveal key={`rec-${mentor.id}`} delay={idx * 0.05} direction="up">
                      <Card className="card-hover bg-card/50 border-accent/30 ring-1 ring-accent/10">
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
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">{mentor.title}</p>
                                {mentor.tier !== 'new' && (
                                  <Badge variant="secondary" className="text-[10px] uppercase h-5 bg-primary/10 text-primary border-primary/20">{mentor.tier}</Badge>
                                )}
                                {mentor.verificationTier && mentor.verificationTier !== 'unverified' && (
                                  <Badge variant="outline" className="text-[10px] capitalize h-5 bg-accent/10 text-accent border-accent/20">
                                    {mentor.verificationTier.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
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
                        </CardContent>
                        <CardFooter className="pt-3">
                          <Button variant="default" size="sm" className="w-full" asChild>
                            <Link to={`/mentors/${mentor.id}`}><CalendarIcon className="mr-2 h-4 w-4" />View Profile</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ama"><MentorAMA /></TabsContent>
        </Tabs>
      </div>

      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} mentor={selectedMentor} slot={pickedSlot} />
      <BecomeMentorModal open={applyModalOpen} onOpenChange={setApplyModalOpen} />
    </div>
  );
};

export default Mentors;
