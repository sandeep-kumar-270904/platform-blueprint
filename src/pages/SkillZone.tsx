import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Award, PlayCircle, CheckCircle2 } from "lucide-react";

const mockSkills = [
  {
    id: 1,
    name: "Communication Skills",
    category: "Soft Skills",
    progress: 65,
    modules: 8,
    completed: 5,
    duration: "4 hours",
  },
  {
    id: 2,
    name: "Leadership & Management",
    category: "Soft Skills",
    progress: 30,
    modules: 10,
    completed: 3,
    duration: "6 hours",
  },
  {
    id: 3,
    name: "Time Management",
    category: "Productivity",
    progress: 90,
    modules: 6,
    completed: 5,
    duration: "3 hours",
  },
];

const SkillZone = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Zap className="mr-1 h-3 w-3" />
                  Skill Development
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Master{" "}
                  <span className="text-foreground display-font">
                    Essential Skills
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Develop soft skills, technical abilities, and earn certificates.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSkills.map((skill, index) => (
            <ScrollReveal key={skill.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">{skill.category}</Badge>
                  <h3 className="text-xl font-bold">{skill.name}</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-medium">{skill.progress}%</span>
                    </div>
                    <Progress value={skill.progress} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{skill.completed}/{skill.modules} modules</span>
                    </div>
                    <span className="text-muted-foreground">{skill.duration}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {skill.progress === 0 ? "Start Learning" : "Continue"}
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

export default SkillZone;
