import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Smile, Meh, Frown, Heart, Brain } from "lucide-react";

const moods = [
  { icon: Smile, label: "Great", color: "text-green-500" },
  { icon: Smile, label: "Good", color: "text-blue-500" },
  { icon: Meh, label: "Okay", color: "text-yellow-500" },
  { icon: Frown, label: "Bad", color: "text-orange-500" },
  { icon: Frown, label: "Terrible", color: "text-red-500" },
];

const Wellness = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Heart className="mr-1 h-3 w-3" />
                  Mental Wellness
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Track Your{" "}
                  <span className="text-foreground display-font">
                    Mental Health
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Monitor your mood, access wellness resources, and maintain mental wellbeing.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <ScrollReveal delay={0.1}>
          <Card className="mb-8">
            <CardHeader>
              <h3 className="text-2xl font-bold text-center">How are you feeling today?</h3>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4">
                {moods.map((mood, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMood(index)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all ${
                      selectedMood === index
                        ? "bg-primary/10 scale-110"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <mood.icon className={`h-12 w-12 ${mood.color}`} />
                    <span className="text-sm font-medium">{mood.label}</span>
                  </button>
                ))}
              </div>
              {selectedMood !== null && (
                <div className="mt-6 text-center">
                  <Button>Log Mood</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          <ScrollReveal delay={0.2}>
            <Card className="hover-scale">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">Wellness Resources</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Meditation Guides
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Stress Management
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Sleep Tips
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Professional Help
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Card className="hover-scale">
              <CardHeader>
                <h3 className="text-xl font-bold">Your Mood Calendar</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded bg-muted/30 hover:bg-primary/20 cursor-pointer transition-colors"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Click to view mood details for each day
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default Wellness;
