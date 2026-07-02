import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  GraduationCap,
  Lightbulb,
  ArrowRight,
  Play
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// CountUp component adjusted for intersection observer if needed, but since we are writing raw logic,
// we will just use a simple raw requestAnimationFrame approach as specified.
const AnimatedNumber = ({ end, duration = 1200 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}</span>;
};

// Reusable scroll reveal hook for .is-visible class
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // optionally unobserve after revealing
            // observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll(".reveal-element");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
};

const Index = () => {
  const { user } = useAuth();
  useScrollReveal();

  const features = [
    {
      id: "notes",
      icon: BookOpen,
      title: "Notes Hub",
      description: "Share and access quality study materials from peers across all subjects",
      featured: true,
    },
    {
      id: "career",
      icon: TrendingUp,
      title: "Career Resources",
      description: "Access jobs, internships, resume tips, and ATS optimization tools",
      featured: true,
    },
    {
      id: "events",
      icon: Calendar,
      title: "Events & Hackathons",
      description: "Track competitions and events with registration",
    },
    {
      id: "community",
      icon: MessageSquare,
      title: "Community Forum",
      description: "Connect with students, ask questions, and share knowledge",
    },
    {
      id: "innovation",
      icon: Lightbulb,
      title: "Innovation Hub",
      description: "Showcase your startup ideas and find co-founders",
    },
    {
      id: "study",
      icon: Users,
      title: "Study Groups",
      description: "Join virtual study rooms and collaborate on projects",
    },
  ];

  const stats = [
    { label: "Active Students", value: 10, suffix: "K+", icon: Users },
    { label: "Study Resources", value: 5, suffix: "K+", icon: BookOpen },
    { label: "Events Listed", value: 500, suffix: "+", icon: Calendar },
    { label: "Success Stories", value: 2, suffix: "K+", icon: GraduationCap },
  ];

  return (
    <div className="theme-landing font-inter min-h-screen bg-background text-foreground relative overflow-hidden">
      
      {/* Dynamic CSS styles for the specific prompt requirements */}
      <style dangerouslySetInnerHTML={{__html: `
        .reveal-element {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal-element.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .highlighter-underline {
          background: linear-gradient(180deg, transparent 65%, var(--accent) 65%);
        }
        .feature-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .feature-grid {
            grid-template-columns: repeat(4, 1fr);
            grid-template-areas:
              "notes notes career career"
              "events community innovation study";
          }
          .feat-notes { grid-area: notes; }
          .feat-career { grid-area: career; }
          .feat-events { grid-area: events; }
          .feat-community { grid-area: community; }
          .feat-innovation { grid-area: innovation; }
          .feat-study { grid-area: study; }
        }
        .feature-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          border: 1px solid var(--border);
          background: var(--card);
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
      `}} />

      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            {/* Right Column (Faux Dashboard) - Appears first on mobile */}
            <div className="md:col-span-5 order-first md:order-last reveal-element">
              <div 
                className="bg-card border border-border p-6" 
                style={{ borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
                  <div className="font-fraunces font-semibold">Student Dashboard</div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                </div>
                
                {/* Faux UI Rows */}
                <div className="space-y-4">
                  <div className="bg-background border border-border rounded-lg p-3 flex justify-between items-center">
                    <span className="text-sm font-medium">DSA Progress</span>
                    <span className="text-xs font-bold text-muted-foreground">47/150</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5 mb-2">
                    <div className="bg-foreground h-1.5 rounded-full" style={{ width: "31%" }}></div>
                  </div>
                  
                  <div className="bg-background border border-border rounded-lg p-4 mt-6">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Next Event</div>
                    <div className="font-fraunces font-medium text-lg mb-1">Global Web3 Hackathon</div>
                    <div className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" /> Tomorrow, 10:00 AM
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="bg-background border border-border rounded-lg p-3 flex-1">
                       <div className="text-xs text-muted-foreground">Study Hours</div>
                       <div className="font-fraunces font-semibold text-xl">14.5h</div>
                    </div>
                    <div className="bg-background border border-border rounded-lg p-3 flex-1">
                       <div className="text-xs text-muted-foreground">New Notes</div>
                       <div className="font-fraunces font-semibold text-xl">8</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column (Text & CTAs) */}
            <div className="md:col-span-7 order-last md:order-first text-left reveal-element" style={{ transitionDelay: '100ms' }}>
              <div className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Your All-in-One Student Platform
              </div>
              <h1 className="mb-6 font-fraunces text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                Where Students <span className="highlighter-underline inline-block pb-1">Succeed</span> Together
              </h1>
              <p className="mb-8 max-w-xl text-lg text-muted-foreground md:text-xl">
                Connect, learn, and grow with a comprehensive platform designed for student success. Access notes, join events, find mentors, and build your career - all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-start">
                <Link to={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="w-full sm:w-auto font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--background)' }}>
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium border-border">
                    <Play className="mr-2 h-4 w-4" /> Watch Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="reveal-element flex flex-col items-center justify-center" 
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="font-fraunces text-4xl md:text-5xl font-bold mb-2 text-foreground">
                  <AnimatedNumber end={stat.value} />{stat.suffix}
                </div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  {stat.label} <span className="text-xs opacity-75">(and growing)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 max-w-2xl reveal-element">
            <h2 className="font-fraunces text-3xl md:text-5xl font-bold mb-4">Everything you need, in one workspace.</h2>
            <p className="text-lg text-muted-foreground">Replace five different tools with a single, seamlessly integrated platform designed specifically for how students actually work.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature, i) => (
              <div 
                key={feature.id} 
                className={`feature-card rounded-xl p-6 md:p-8 reveal-element feat-${feature.id}`}
                style={{ "--i": i, transitionDelay: `${i * 80}ms` } as any}
              >
                <div className="mb-6 flex items-center justify-start">
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <feature.icon className="h-6 w-6 text-foreground" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="mb-3 font-fraunces text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{feature.description}</p>
                {feature.featured && (
                  <div className="mt-auto pt-4 border-t border-border">
                    <Link to={`/${feature.id === 'career' ? 'dashboard' : feature.id}`} className="inline-flex items-center text-sm font-medium text-foreground hover:text-accent transition-colors">
                      Explore {feature.title} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-background" style={{ backgroundColor: 'var(--accent)' }}>
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="font-fraunces font-bold text-xl">StudentHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering students with the tools they need to succeed.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-fraunces font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/notes" className="hover:text-foreground">Notes Hub</Link></li>
                <li><Link to="/events" className="hover:text-foreground">Events</Link></li>
                <li><Link to="/community" className="hover:text-foreground">Community Forum</Link></li>
                <li><Link to="/innovation" className="hover:text-foreground">Innovation Hub</Link></li>
                <li><Link to="/study" className="hover:text-foreground">Study Groups</Link></li>
                <li><Link to="/dashboard" className="hover:text-foreground">Career Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-fraunces font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-fraunces font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © 2026 StudentHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
