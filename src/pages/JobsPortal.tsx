import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Briefcase, MapPin, DollarSign, Clock, Search, Bookmark } from "lucide-react";

const mockJobs = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "TechCorp",
    location: "Bangalore",
    type: "Full-time",
    salary: "₹8-12 LPA",
    postedDays: 2,
    logo: "💼",
  },
  {
    id: 2,
    title: "Data Analyst Intern",
    company: "DataCo",
    location: "Remote",
    type: "Internship",
    salary: "₹20k/month",
    postedDays: 5,
    logo: "📊",
  },
  {
    id: 3,
    title: "Product Designer",
    company: "DesignHub",
    location: "Mumbai",
    type: "Full-time",
    salary: "₹10-15 LPA",
    postedDays: 1,
    logo: "🎨",
  },
];

const JobsPortal = () => {
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
                  <Briefcase className="mr-1 h-3 w-3" />
                  Career Opportunities
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Find Your{" "}
                  <span className="text-foreground display-font">
                    Dream Job
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Discover internships and full-time opportunities from top companies.
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
                placeholder="Search jobs, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockJobs.map((job, index) => (
            <ScrollReveal key={job.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-4xl mb-2">{job.logo}</div>
                    <Button variant="ghost" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-xl font-bold">{job.title}</h3>
                  <p className="text-sm font-medium text-primary">{job.company}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{job.type}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{job.postedDays}d ago</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" className="flex-1">Save</Button>
                  <Button className="flex-1">Apply</Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobsPortal;
