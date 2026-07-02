import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Briefcase, Star, MapPin, DollarSign, Clock } from "lucide-react";

const mockServices = [
  {
    id: 1,
    provider: "Priya Sharma",
    service: "Web Development",
    description: "Full-stack MERN developer with 3 years experience",
    rate: "₹500/hour",
    rating: 4.9,
    reviews: 45,
    location: "Remote",
    availability: "Available"
  },
  {
    id: 2,
    provider: "Arjun Patel",
    service: "UI/UX Design",
    description: "Create stunning interfaces and user experiences",
    rate: "₹400/hour",
    rating: 4.8,
    reviews: 32,
    location: "Bangalore",
    availability: "Busy"
  },
  {
    id: 3,
    provider: "Sneha Reddy",
    service: "Content Writing",
    description: "SEO-optimized content for websites and blogs",
    rate: "₹300/hour",
    rating: 5.0,
    reviews: 28,
    location: "Remote",
    availability: "Available"
  }
];

const PostSkill = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <Briefcase className="mr-1 h-3 w-3" />
                  Skill Marketplace
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Post Your{" "}
                  <span className="text-foreground display-font">
                    Skill
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Showcase your skills, set your rates, and connect with clients looking for your expertise.
                </p>
                <Button size="lg" className="hover-scale">
                  List Your Service
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 max-w-2xl mx-auto">
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {mockServices.map((service, index) => (
            <ScrollReveal key={service.id} delay={0.1 * (index + 1)}>
              <Card className="hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{service.service}</h3>
                      <p className="text-sm text-muted-foreground mb-2">by {service.provider}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm font-medium">{service.rating}</span>
                          <span className="text-xs text-muted-foreground">({service.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={service.availability === "Available" ? "default" : "secondary"}>
                      {service.availability}
                    </Badge>
                  </div>
                  <p className="text-sm">{service.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{service.rate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{service.location}</span>
                      </div>
                    </div>
                    <Button className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      Book Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostSkill;
