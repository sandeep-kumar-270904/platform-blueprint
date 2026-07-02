import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnboardingModal } from "@/components/OnboardingModal";
import { CountUp } from "@/components/animations/CountUp";
import {
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Lightbulb,
  Award,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleOnboardingComplete = (preferences: any) => {
    console.log("Onboarding completed with preferences:", preferences);
  };

  const features = [
    {
      icon: BookOpen,
      title: "Notes Hub",
      description: "Share and access quality study materials from peers across all subjects",
    },
    {
      icon: Calendar,
      title: "Events & Hackathons",
      description: "Never miss opportunities - track competitions and events with registration",
    },
    {
      icon: MessageSquare,
      title: "Community Forum",
      description: "Connect with students, ask questions, and share knowledge in vibrant discussions",
    },
    {
      icon: Lightbulb,
      title: "Innovation Hub",
      description: "Showcase your startup ideas, find co-founders, and get mentor guidance",
    },
    {
      icon: TrendingUp,
      title: "Career Resources",
      description: "Access jobs, internships, resume tips, and ATS optimization tools",
    },
    {
      icon: Users,
      title: "Study Groups",
      description: "Form teams, join virtual study rooms, and collaborate on projects",
    },
  ];

  const stats = [
    { label: "Active Students", value: 10, suffix: "K+", icon: Users },
    { label: "Study Resources", value: 5, suffix: "K+", icon: BookOpen },
    { label: "Events Listed", value: 500, suffix: "+", icon: Calendar },
    { label: "Success Stories", value: 2, suffix: "K+", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <OnboardingModal onComplete={handleOnboardingComplete} />
      <Header />

      {/* Hero Section */}
      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-24 md:py-32">
          <ScrollReveal direction="down">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-4xl text-center">
                <Badge variant="outline" className="mb-6 animate-fade-in bg-surface">
                  <Sparkles className="mr-1 h-3 w-3 text-primary" />
                  Your All-in-One Student Platform
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl display-font text-foreground">
                  Where Students{" "}
                  <span className="text-primary">
                    Succeed Together
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                  Connect, learn, and grow with a comprehensive platform designed for student success. Access notes, join events, find mentors, and build your career - all in one place.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link to={user ? "/dashboard" : "/auth"}>
                    <Button variant="default" size="xl" className="group">
                      Explore Platform
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="xl">
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </ParallaxSection>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 0.1} direction="scale">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex items-center justify-center text-foreground">
                    <stat.icon className="h-6 w-6 text-muted-foreground" strokeWidth={2} />
                  </div>
                  <div className="text-3xl font-bold mono-font">
                    <CountUp value={stat.value as number} suffix={stat.suffix as string} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <ParallaxSection speed={0.2}>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <ScrollReveal direction="up">
              <div className="mb-12 text-center">
                <Badge variant="outline" className="mb-4">
                  <Target className="mr-1 h-3 w-3" />
                  Platform Features
                </Badge>
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  Everything You Need to Succeed
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  A comprehensive suite of tools and resources designed to support your academic journey and career growth
                </p>
              </div>
            </ScrollReveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <ScrollReveal key={index} delay={index * 0.05} direction="scale">
                  <div className="group rounded-md border border-border bg-card p-6 flex flex-col h-full transition-all duration-300 hover:border-primary/50">
                    <div className="mb-6 flex items-center justify-start text-foreground">
                      <feature.icon className="h-6 w-6 text-muted-foreground transition-colors duration-300 group-hover:text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="mb-2 text-lg font-medium display-font">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground flex-1 mb-6">{feature.description}</p>
                    <div className="mt-auto">
                      <Button variant="ghost" size="sm" className="group-hover:text-primary px-0 font-medium">
                        Learn more
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                      </Button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* CTA Section */}
      <ParallaxSection speed={0.1}>
        <section className="border-t border-border/40 bg-card/30 backdrop-blur-sm py-20">
          <div className="container mx-auto px-4">
              <ScrollReveal direction="up">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mb-8 inline-flex items-center justify-center text-primary">
                    <Zap className="h-12 w-12" strokeWidth={1.5} />
                  </div>
                  <h2 className="mb-4 text-3xl font-bold md:text-4xl display-font">
                    Ready to Transform Your Student Experience?
                  </h2>
                  <p className="mb-8 text-lg text-muted-foreground">
                    Join thousands of students already using StudentHub to excel in their academics and career
                  </p>
                  <Link to={user ? "/dashboard" : "/auth"}>
                    <Button variant="default" size="xl" className="group">
                      Start Your Journey
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </ParallaxSection>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="font-bold display-font">StudentHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering students with the tools they need to succeed.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/notes" className="hover:text-foreground">Notes Hub</Link></li>
                <li><Link to="/events" className="hover:text-foreground">Events</Link></li>
                <li><Link to="/community" className="hover:text-foreground">Community</Link></li>
                <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            © 2025 StudentHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
