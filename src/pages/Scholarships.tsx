import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DollarSign, Calendar, CheckCircle2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockScholarships = [
  {
    id: 1,
    name: "Merit-Based Engineering Scholarship",
    amount: "₹50,000",
    deadline: "Dec 31, 2025",
    eligibility: "CGPA > 8.0",
    type: "Merit-based",
  },
  {
    id: 2,
    name: "Need-Based Education Grant",
    amount: "₹1,00,000",
    deadline: "Jan 15, 2026",
    eligibility: "Family income < ₹5L",
    type: "Need-based",
  },
  {
    id: 3,
    name: "Women in STEM Scholarship",
    amount: "₹75,000",
    deadline: "Feb 28, 2026",
    eligibility: "Female students in STEM",
    type: "Category-based",
  },
];

const Scholarships = () => {
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
                  <DollarSign className="mr-1 h-3 w-3" />
                  Financial Aid
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Find{" "}
                  <span className="text-foreground display-font">
                    Scholarships
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Discover scholarships and financial aid opportunities to fund your education.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <ScrollReveal delay={0.1}>
          <div className="mb-8 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockScholarships.map((scholarship, index) => (
            <ScrollReveal key={scholarship.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">{scholarship.type}</Badge>
                  <h3 className="text-xl font-bold">{scholarship.name}</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <DollarSign className="h-6 w-6" />
                    {scholarship.amount}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Deadline: {scholarship.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{scholarship.eligibility}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Check Eligibility</Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scholarships;
