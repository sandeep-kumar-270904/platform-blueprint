import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Search, CheckCircle2, Loader2, ArrowRight, Clock, MapPin, Tag, Sparkles, Trophy } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useTeams, useCreateTeam, useApplyToTeam, useRecommendedTeams, type Team } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { FounderTrustSignal } from "@/components/team/FounderTrustSignal";

const CATEGORIES = ['Hackathon', 'Research', 'Startup', 'Course Project', 'Other'];



export default function TeamHunt() {
  const { t } = useTranslation();
  const isOffline = !navigator.onLine;
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("open");
  const [sort, setSort] = useState<string>("newest");

  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useTeams({
    search: debouncedSearch,
    category: category !== "all" ? category : undefined,
    status: status,
    sort: sort,
    limit: 50,
    eventId: eventId || undefined,
  });

  const { data: recommendedData, isLoading: recommendedLoading } = useRecommendedTeams();

  const teams = data?.data || [];
  const recommendedTeams = recommendedData || [];

  return (
    <div className="min-h-screen bg-background">
            <Header />
      {isOffline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-amber-600 dark:text-amber-400 text-sm font-medium flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" />
          {t('Offline Mode - Showing Cached Data')}
        </div>
      )}

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-16 md:py-24 border-b">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Users className="mr-1 h-3 w-3" />
                  Team Building
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  {t("Find a Team")}{" "}
                  <span className="text-foreground display-font">
                    Dream Team
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Connect with talented individuals for hackathons, research, and collaborative projects.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <CreateTeamModal />
                  <Button variant="outline" size="lg" onClick={() => navigate('/team-hunt/dashboard')}>
                    My Dashboard
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => navigate('/team-hunt/leaderboard')} className="gap-2 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/50">
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Find a Team") + "..."}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most-applicants">Most Applicants</SelectItem>
                <SelectItem value="deadline-soonest">Deadline Soonest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="browse">{t("Find a Team")}</TabsTrigger>
            <TabsTrigger value="recommended" className="gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Recommended for You
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {/* Results */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading teams...</p>
              </div>
            ) : error ? (
              <div className="text-center py-24 text-destructive">
                <p>Failed to load teams. Please try again.</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed">
                <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-bold mb-2">No teams found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any teams matching your current filters. Try adjusting your search or create your own team!
                </p>
                <div className="mt-6">
                  <CreateTeamModal variant="outline" />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team: Team, index: number) => (
                  <TeamCard key={team._id} team={team} index={index} currentUserId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommended">
            {recommendedLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Finding the best matches...</p>
              </div>
            ) : recommendedTeams.length === 0 ? (
              <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-xl font-bold mb-2">Add skills to get recommendations</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We need to know your skills to recommend teams. Head over to your profile or the resume builder to add some!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedTeams.map((team: Team, index: number) => (
                  <TeamCard key={team._id} team={team} index={index} currentUserId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TeamCard({ team, index, currentUserId }: { team: Team, index: number, currentUserId?: string }) {
  const isCreator = currentUserId === team.creator?._id;
  const isFull = team.teamSize.current >= team.teamSize.max;
  const navigate = useNavigate();

  return (
    <ScrollReveal delay={0.05 * (index % 10)}>
      <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant={team.status === 'open' ? 'default' : 'secondary'} className={team.status === 'open' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}>
                {team.status.toUpperCase()}
              </Badge>
              {team.matchScore !== undefined && (
                <Badge variant="outline" className={`font-semibold ${
                  team.matchScore >= 70 ? 'border-green-500 text-green-600 bg-green-500/10' :
                  team.matchScore >= 40 ? 'border-yellow-500 text-yellow-600 bg-yellow-500/10' :
                  'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {team.matchScore}% Match
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium bg-muted px-2 py-1 rounded-full">
              <Users className="h-3.5 w-3.5" />
              <span>{team.teamSize.current} / {team.teamSize.max}</span>
            </div>
          </div>
          <h3 className="text-xl font-bold line-clamp-2 leading-tight">{team.title}</h3>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            <span>{team.category}</span>
            {team.deadline && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDistanceToNow(new Date(team.deadline), { addSuffix: true })}</span>
              </>
            )}
          </div>
          <FounderTrustSignal
            creatorId={team.creator?._id}
            creatorName={team.creator?.username || team.creator?.full_name}
            trust={team.creator?.creatorTrust || team.creatorTrust}
            variant="card"
          />
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">{team.description}</p>
          
          {team.requiredRoles?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Roles Needed</p>
              <div className="flex flex-wrap gap-1.5">
                {team.requiredRoles.slice(0, 3).map((role, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">{role}</Badge>
                ))}
                {team.requiredRoles.length > 3 && (
                  <Badge variant="secondary" className="text-xs font-normal">+{team.requiredRoles.length - 3}</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4 border-t gap-3 flex-col sm:flex-row">
          {isCreator ? (
            <Button className="w-full" variant="default" onClick={() => navigate(`/team-hunt/${team._id}/manage`)}>
              Manage Applicants
            </Button>
          ) : (
            <ApplyToTeamModal team={team} isFull={isFull} />
          )}
        </CardFooter>
      </Card>
    </ScrollReveal>
  );
}

function CreateTeamModal({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  const { mutate: createTeam, isPending } = useCreateTeam();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Hackathon",
    maxSize: 4,
    roles: "",
    skills: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      teamSize: { current: 1, max: formData.maxSize },
      requiredRoles: formData.roles.split(',').map(s => s.trim()).filter(Boolean),
      requiredSkills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
    }, {
      onSuccess: () => {
        toast.success("Team created successfully!");
        setOpen(false);
        setFormData({ title: "", description: "", category: "Hackathon", maxSize: 4, roles: "", skills: "" });
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to create team");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={variant === 'default' ? 'lg' : 'default'} className="gap-2">
          <Users className="h-4 w-4" />
          Create a Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Team Title / Project Name *</Label>
            <Input id="title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. AI Study Group" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What are you building? What's the goal?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSize">Max Team Size *</Label>
              <Input id="maxSize" type="number" min={2} max={20} required value={formData.maxSize} onChange={e => setFormData({ ...formData, maxSize: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="roles">Required Roles (comma separated)</Label>
            <Input id="roles" placeholder="e.g. Frontend, Designer, ML Engineer" value={formData.roles} onChange={e => setFormData({ ...formData, roles: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Required Skills (comma separated)</Label>
            <Input id="skills" placeholder="e.g. React, Python, Figma" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApplyToTeamModal({ team, isFull }: { team: Team, isFull: boolean }) {
  const [open, setOpen] = useState(false);
  const { mutate: apply, isPending } = useApplyToTeam();
  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apply({
      teamId: team._id,
      message,
      skillsOffered: skills.split(',').map(s => s.trim()).filter(Boolean),
    }, {
      onSuccess: () => {
        toast.success("Application sent successfully!");
        setOpen(false);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to apply");
      }
    });
  };

  if (team.status !== 'open') {
    return <Button className="w-full" disabled variant="outline">{team.status.toUpperCase()}</Button>;
  }
  
  if (isFull) {
    return <Button className="w-full" disabled variant="outline">TEAM FULL</Button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply to Join Team</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Applying to: <span className="font-medium text-foreground">{team.title}</span></p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="message">Why do you want to join? *</Label>
            <Textarea 
              id="message" 
              required 
              rows={4} 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Tell the creator about your background and why you're a good fit..." 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skillsOffer">Skills you can offer (comma separated)</Label>
            <Input 
              id="skillsOffer" 
              value={skills} 
              onChange={e => setSkills(e.target.value)} 
              placeholder="e.g. React, Node.js, Design" 
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
