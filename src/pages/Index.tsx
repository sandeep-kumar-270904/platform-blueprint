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

const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up");
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
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual (On top for mobile) */}
            <div className="lg:col-span-5 lg:order-2 w-full animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="dashboard-card">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
                  <div className="text-title">Student Dashboard</div>
                  <div className="flex gap-1.5" aria-hidden="true">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                </div>
                
                {/* Faux UI Rows */}
                <div className="space-y-4">
                  <div className="bg-[var(--surface-sunk)] rounded-[var(--radius-sm)] border-none p-3 flex justify-between items-center">
                    <span className="text-label">DSA Progress</span>
                    <span className="text-caption">47/150</span>
                  </div>
                  <div className="w-full bg-[var(--border)] rounded-full h-1.5 mb-2">
                    <div className="bg-[var(--ink)] h-1.5 rounded-full" style={{ width: "31%" }}></div>
                  </div>
                  
                  <div className="bg-[var(--surface-sunk)] rounded-[var(--radius-sm)] border-none p-4 mt-6">
                    <div className="label mb-1">Next Event</div>
                    <div className="text-title mb-1">Campus Coding Hackathon</div>
                    <div className="text-caption flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Tomorrow, 10:00 AM
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-[var(--space-2)]">
                    <div className="bg-[var(--surface-sunk)] rounded-[var(--radius-sm)] border-none p-3">
                       <div className="text-label">Study Hours</div>
                       <div className="text-value mt-1">14.5h</div>
                    </div>
                    <div className="bg-[var(--surface-sunk)] rounded-[var(--radius-sm)] border-none p-3">
                       <div className="text-label">New Notes</div>
                       <div className="text-value mt-1">8</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column (Text & CTAs) */}
            <div className="lg:col-span-7 lg:order-1 text-left w-full animate-fade-up">
              <div className="hero-eyebrow mb-4 inline-flex items-center">
                Your All-in-One Student Platform
              </div>
              <h1 className="hero-headline mb-6">
                Where Students <span className="highlight inline-block pb-1">Succeed</span> Together
              </h1>
              <p className="body-text mb-8 max-w-xl">
                Connect, learn, and grow with a comprehensive platform designed for student success. Access notes, join events, find mentors, and build your career - all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-start">
                <Link to={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="btn-primary w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" className="btn-secondary w-full sm:w-auto">
                    <Play className="mr-2 h-4 w-4" /> Watch Demo
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-[var(--border)] section-dark">
        <div className="container">
          <div className="stats-grid text-center">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="reveal-element opacity-0 flex flex-col items-center justify-center" 
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="stat-number text-4xl md:text-5xl mb-2">
                  <AnimatedNumber end={stat.value} />{stat.suffix}
                </div>
                <div className="text-sm font-medium text-[var(--ink-soft)] flex items-center gap-1.5">
                  {stat.label} <span className="text-xs text-[var(--ink-faint)]">(and growing)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24">
        <div className="container">
          <div className="mb-16 max-w-2xl reveal-element opacity-0">
            <h2 className="section-headline mb-4">Everything you need, in one workspace.</h2>
            <p className="body-text">Replace five different tools with a single, seamlessly integrated platform designed specifically for how students actually work.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature, i) => (
              <div 
                key={feature.id} 
                className={`card reveal-element opacity-0 feature-${feature.id}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-6 flex items-center justify-start">
                  <div className="icon-box">
                    <feature.icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-title mb-3">{feature.title}</h3>
                <p className="body-text text-sm mb-6">{feature.description}</p>
                <div className="mt-auto pt-4 border-t card-footer-border">
                  <Link to={`/${feature.id === 'career' ? 'dashboard' : feature.id}`} className="card-link inline-flex items-center text-sm font-medium transition-colors">
                    Explore {feature.title} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 section-dark">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="icon-box bg-[var(--canvas)] text-[var(--ink)]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-fraunces font-bold text-xl">StudentHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering students with the tools they need to succeed.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-bold">Platform</h4>
              <ul className="flex flex-col gap-[var(--space-1)] text-sm text-muted-foreground">
                <li><Link to="/notes" className="transition-colors">Notes Hub</Link></li>
                <li><Link to="/events" className="transition-colors">Events & Hackathons</Link></li>
                <li><Link to="/community" className="transition-colors">Community Forum</Link></li>
                <li><Link to="/innovation" className="transition-colors">Innovation Hub</Link></li>
                <li><Link to="/study" className="transition-colors">Study Groups</Link></li>
                <li><Link to="/dashboard" className="transition-colors">Career Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold">Resources</h4>
              <ul className="flex flex-col gap-[var(--space-1)] text-sm text-muted-foreground">
                <li><a href="#" className="transition-colors">Documentation</a></li>
                <li><a href="#" className="transition-colors">Tutorials</a></li>
                <li><a href="#" className="transition-colors">Blog</a></li>
                <li><a href="#" className="transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold">Company</h4>
              <ul className="flex flex-col gap-[var(--space-1)] text-sm text-muted-foreground">
                <li><a href="#" className="transition-colors">About</a></li>
                <li><a href="#" className="transition-colors">Careers</a></li>
                <li><a href="#" className="transition-colors">Privacy</a></li>
                <li><a href="#" className="transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-sm text-muted-foreground">
            © 2026 StudentHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
