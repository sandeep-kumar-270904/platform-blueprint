import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Code, FileText, TrendingUp, CheckCircle2 } from "lucide-react";

const PlacementCell = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Target className="mr-1 h-3 w-3" />
                  Placement Preparation
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Ace Your{" "}
                  <span className="text-foreground display-font">
                    Campus Placements
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Company-wise resources, coding practice, and interview preparation materials.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ScrollReveal delay={0.1}>
            <Card className="hover-scale">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Code className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">250 Problems</Badge>
                </div>
                <h3 className="text-xl font-bold">DSA Practice</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Curated problem sets for data structures and algorithms
                </p>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                <Button className="w-full">Start Practice</Button>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Card className="hover-scale">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">50+ Guides</Badge>
                </div>
                <h3 className="text-xl font-bold">Interview Prep</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Company-specific interview experiences and preparation guides
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Technical Questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>HR Round Tips</span>
                  </div>
                </div>
                <Button className="w-full">View Resources</Button>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Card className="hover-scale">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">Live</Badge>
                </div>
                <h3 className="text-xl font-bold">Mock Interviews</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Schedule mock interviews with industry professionals
                </p>
                <div className="text-2xl font-bold text-primary">12 Available</div>
                <Button className="w-full">Book Session</Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default PlacementCell;
