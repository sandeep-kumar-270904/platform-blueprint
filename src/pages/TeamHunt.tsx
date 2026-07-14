import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Users, Code, Palette, Database, CheckCircle2 } from "lucide-react";

const mockProjects = [];

const TeamHunt = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Users className="mr-1 h-3 w-3" />
                  Team Building
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Find Your{" "}
                  <span className="text-foreground display-font">
                    Dream Team
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Connect with talented individuals for hackathons and collaborative projects.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {mockProjects.map((project, index) => (
            <ScrollReveal key={project.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default">
                      {project.matchScore}% Match
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{project.teamSize}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{project.title}</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                  <div>
                    <p className="text-sm font-medium mb-2">Needed Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.neededRoles.map((role) => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" className="flex-1">View Details</Button>
                  <Button className="flex-1 gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Apply
                  </Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamHunt;
