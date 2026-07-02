import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ArrowRight, Clock, Star } from "lucide-react";

const mockOffers = [
  {
    id: 1,
    user: "Priya Sharma",
    offering: "Web Development",
    seeking: "UI/UX Design",
    experience: "2 years",
    rating: 4.8,
    matchScore: 95
  },
  {
    id: 2,
    user: "Arjun Patel",
    offering: "Machine Learning",
    seeking: "Backend Development",
    experience: "1.5 years",
    rating: 4.9,
    matchScore: 88
  },
  {
    id: 3,
    user: "Sneha Reddy",
    offering: "Graphic Design",
    seeking: "Content Writing",
    experience: "3 years",
    rating: 5.0,
    matchScore: 82
  }
];

const SkillSwap = () => {
  const [selectedTab, setSelectedTab] = useState("browse");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Skill Exchange
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Skill{" "}
                  <span className="text-foreground display-font">
                    Swap
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Exchange skills with peers. Teach what you know, learn what you need.
                </p>
                <Button size="lg" className="hover-scale">
                  Post Your Offer
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="myoffers">My Offers</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {mockOffers.map((offer, index) => (
                <ScrollReveal key={offer.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{offer.user}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{offer.experience}</Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              <span className="text-sm">{offer.rating}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="default">{offer.matchScore}% match</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 p-3 rounded-lg bg-primary/10">
                            <p className="text-xs text-muted-foreground mb-1">Offering</p>
                            <p className="font-semibold">{offer.offering}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 p-3 rounded-lg bg-accent/10">
                            <p className="text-xs text-muted-foreground mb-1">Seeking</p>
                            <p className="font-semibold">{offer.seeking}</p>
                          </div>
                        </div>
                        <Button className="w-full">
                          <Clock className="mr-2 h-4 w-4" />
                          Schedule Exchange
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matches">
            <p className="text-center text-muted-foreground">Your skill matches will appear here</p>
          </TabsContent>

          <TabsContent value="myoffers">
            <p className="text-center text-muted-foreground">Your posted offers will appear here</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SkillSwap;
