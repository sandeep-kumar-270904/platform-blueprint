import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Star, MapPin, Users, DollarSign, Search, TrendingUp, Award } from "lucide-react";

const mockColleges = [
  {
    id: 1,
    name: "IIT Delhi",
    location: "New Delhi",
    rating: 4.8,
    reviews: 1250,
    fees: "₹2L/year",
    placement: "98%",
    avgPackage: "₹24 LPA",
    logo: "🎓",
  },
  {
    id: 2,
    name: "BITS Pilani",
    location: "Pilani, Rajasthan",
    rating: 4.7,
    reviews: 980,
    fees: "₹4.5L/year",
    placement: "96%",
    avgPackage: "₹18 LPA",
    logo: "🏛️",
  },
  {
    id: 3,
    name: "NIT Trichy",
    location: "Tiruchirappalli",
    rating: 4.6,
    reviews: 856,
    fees: "₹1.5L/year",
    placement: "94%",
    avgPackage: "₹15 LPA",
    logo: "🎓",
  },
];

const CollegeInsights = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Award className="mr-1 h-3 w-3" />
                  Real Student Reviews
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Find Your{" "}
                  <span className="text-foreground display-font">
                    Dream College
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Compare colleges, read verified reviews, and make informed decisions about your future.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <ScrollReveal delay={0.1}>
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockColleges.map((college, index) => (
            <ScrollReveal key={college.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <div className="text-5xl mb-4">{college.logo}</div>
                  <h3 className="text-xl font-bold">{college.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {college.location}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium">{college.rating}</span>
                      <span className="text-sm text-muted-foreground">({college.reviews})</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{college.fees}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>{college.placement}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Avg Package: {college.avgPackage}
                  </Badge>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Details</Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollegeInsights;
