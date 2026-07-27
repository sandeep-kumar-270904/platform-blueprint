import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ArrowRight, Clock, Star, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useSkillOffers,
  useMySkillOffers,
  useSkillMatches,
  useSkillRequests,
  useCreateSkillOffer,
  useCreateSkillRequest,
  useUpdateSkillRequestStatus,
  useDeleteSkillOffer,
  SkillOffer,
  SkillMatch
} from "@/hooks/useSkillSwap";

// Sub-components to keep file clean
const OfferCard = ({ offer, onSchedule }: { offer: SkillOffer, onSchedule: (offerId: string) => void }) => (
  <Card className="hover-lift flex flex-col h-full">
    <CardHeader>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={offer.user?.avatar || 'https://github.com/shadcn.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="text-lg font-bold leading-tight">{offer.user?.name || 'Anonymous User'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">{offer.proficiencyLevel}</Badge>
              <Badge variant="outline" className="text-xs">{offer.category}</Badge>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-1 flex flex-col justify-between">
      <div className="space-y-4 mb-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{offer.description}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 p-3 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Offering</p>
            <p className="font-semibold text-sm line-clamp-1">{offer.skillName}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 p-3 rounded-lg bg-accent/10">
            <p className="text-xs text-muted-foreground mb-1">Seeking</p>
            <p className="font-semibold text-sm line-clamp-1">{offer.wantsToLearn.join(', ') || 'Anything'}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <Clock className="inline mr-1 h-3 w-3" /> Availability: {offer.availability}
        </div>
      </div>
      <Button className="w-full" onClick={() => onSchedule(offer._id)}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Request Exchange
      </Button>
    </CardContent>
  </Card>
);

const MatchCard = ({ match, onRequest }: { match: SkillMatch, onRequest: (toUserId: string, offerId: string) => void }) => (
  <Card className="hover-lift border-primary/20 bg-primary/5">
    <CardHeader>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={match.otherOffer.user?.avatar || 'https://github.com/shadcn.png'} alt="avatar" className="w-10 h-10 rounded-full" />
          <div>
            <h3 className="text-lg font-bold">{match.otherOffer.user?.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{match.otherOffer.proficiencyLevel}</Badge>
            </div>
          </div>
        </div>
        <Badge variant="default" className="bg-primary">{match.matchScore}% match</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 p-3 rounded-lg bg-background">
            <p className="text-xs text-muted-foreground mb-1">They Offer</p>
            <p className="font-semibold text-sm">{match.otherOffer.skillName}</p>
          </div>
          <RefreshCw className="h-5 w-5 text-primary" />
          <div className="flex-1 p-3 rounded-lg bg-background">
            <p className="text-xs text-muted-foreground mb-1">You Offer</p>
            <p className="font-semibold text-sm">{match.myOffer.skillName}</p>
          </div>
        </div>
        <Button className="w-full" onClick={() => onRequest(match.otherOffer.user._id, match.otherOffer._id)}>
          Request Exchange
        </Button>
      </div>
    </CardContent>
  </Card>
);

const SkillSwap = () => {
  const [selectedTab, setSelectedTab] = useState("browse");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();

  // Queries
  const { data: offersData, isLoading: offersLoading } = useSkillOffers(1, 20, search, category);
  const { data: matches, isLoading: matchesLoading } = useSkillMatches();
  const { data: myOffers, isLoading: myOffersLoading } = useMySkillOffers();
  const { data: requests, isLoading: requestsLoading } = useSkillRequests();

  // Mutations
  const createRequestMutation = useCreateSkillRequest();
  const createOfferMutation = useCreateSkillOffer();
  const deleteOfferMutation = useDeleteSkillOffer();
  const updateReqStatusMutation = useUpdateSkillRequestStatus();

  const handleRequestExchange = async (toUserId: string, offerId: string) => {
    try {
      await createRequestMutation.mutateAsync({ toUserId, offerId, message: "Hi! I'd love to exchange skills with you." });
      toast({ title: "Request Sent!", description: "They will be notified of your request." });
    } catch (error: any) {
      toast({ title: "Failed to send request", description: error.response?.data?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleCreateOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      skillName: formData.get('skillName') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      proficiencyLevel: formData.get('proficiencyLevel') as string,
      wantsToLearn: (formData.get('wantsToLearn') as string).split(',').map(s => s.trim()),
      availability: formData.get('availability') as string
    };
    try {
      await createOfferMutation.mutateAsync(data);
      toast({ title: "Offer Posted!", description: "Your skill offer is now live." });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({ title: "Failed to post", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Skill Exchange
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Skill <span className="text-primary display-font">Swap</span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Exchange skills with peers. Teach what you know, learn what you need. All for free.
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="hover-scale">Post Your Offer</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Post a Skill Offer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateOffer} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">What skill can you teach?</label>
                        <Input name="skillName" required placeholder="e.g. React.js, Conversational Spanish" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <Input name="category" required placeholder="e.g. Programming, Languages, Design" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Input name="description" placeholder="Briefly describe your experience" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Your Proficiency</label>
                        <select name="proficiencyLevel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">What do you want to learn? (comma separated)</label>
                        <Input name="wantsToLearn" required placeholder="e.g. Node.js, UI Design" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Availability</label>
                        <Input name="availability" placeholder="e.g. Weekends, Evenings" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createOfferMutation.isPending}>
                        {createOfferMutation.isPending ? 'Posting...' : 'Post Offer'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="matches">My Matches</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="myoffers">My Offers</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="max-w-4xl mx-auto flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search skills..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Input 
                placeholder="Category (e.g. Programming)" 
                className="w-48"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            
            {offersLoading ? (
              <p className="text-center text-muted-foreground py-12">Loading offers...</p>
            ) : offersData?.data?.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No skill offers found. Be the first to post one!</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {offersData?.data?.map((offer: SkillOffer, index: number) => (
                  <ScrollReveal key={offer._id} delay={0.05 * (index + 1)}>
                    <OfferCard 
                      offer={offer} 
                      onSchedule={(id) => handleRequestExchange(offer.user._id, id)} 
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches">
            {matchesLoading ? (
               <p className="text-center text-muted-foreground py-12">Finding perfect matches for your skills...</p>
            ) : matches?.length === 0 ? (
               <div className="text-center py-12">
                 <p className="text-muted-foreground mb-4">No perfect matches found yet.</p>
                 <p className="text-sm">Try adding more skills to your 'wants to learn' list or post a new offer.</p>
               </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {matches?.map((match: SkillMatch, i: number) => (
                  <MatchCard key={i} match={match} onRequest={handleRequestExchange} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h3 className="text-lg font-bold mb-4">Incoming Requests</h3>
                {requestsLoading ? <p>Loading...</p> : requests?.incoming?.length === 0 ? <p className="text-sm text-muted-foreground">No incoming requests.</p> : (
                  <div className="space-y-4">
                    {requests?.incoming?.map((req) => (
                      <Card key={req._id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{req.fromUser?.name} requested your {req.offer?.skillName} skill</p>
                            <p className="text-sm text-muted-foreground mt-1">"{req.message}"</p>
                            <Badge className="mt-2" variant={req.status === 'pending' ? 'secondary' : req.status === 'accepted' ? 'default' : 'destructive'}>{req.status}</Badge>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateReqStatusMutation.mutate({ id: req._id, status: 'accepted' })}>Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => updateReqStatusMutation.mutate({ id: req._id, status: 'declined' })}>Decline</Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4">Outgoing Requests</h3>
                {requestsLoading ? <p>Loading...</p> : requests?.outgoing?.length === 0 ? <p className="text-sm text-muted-foreground">No outgoing requests.</p> : (
                  <div className="space-y-4">
                    {requests?.outgoing?.map((req) => (
                      <Card key={req._id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">You requested {req.offer?.skillName} from {req.toUser?.name}</p>
                            <Badge className="mt-2" variant={req.status === 'pending' ? 'secondary' : req.status === 'accepted' ? 'default' : 'destructive'}>{req.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="myoffers">
            {myOffersLoading ? (
              <p className="text-center text-muted-foreground py-12">Loading your offers...</p>
            ) : myOffers?.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">You haven't posted any offers yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {myOffers?.map((offer: SkillOffer) => (
                  <Card key={offer._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{offer.skillName}</h3>
                          <Badge variant={offer.status === 'active' ? 'default' : 'secondary'} className="mt-1">{offer.status}</Badge>
                        </div>
                        {offer.status === 'active' && (
                          <Button variant="destructive" size="sm" onClick={() => deleteOfferMutation.mutate(offer._id)}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>
                      <p className="text-xs"><strong>Wants:</strong> {offer.wantsToLearn.join(', ')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default SkillSwap;
