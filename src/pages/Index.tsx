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
  Play,
  CheckCircle2,
  Zap,
  Globe,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";

const premiumTransition = { duration: 0.85, ease: [0.22, 1, 0.36, 1] };

const HowItWorksCard = ({ step, title, desc, image, index, shouldReduceMotion }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[24px] border border-border/50 bg-card p-8 text-center flex flex-col items-center will-change-transform z-10 cursor-pointer"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.2 + 0.1, ...premiumTransition }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      animate={{
        y: isHovered && !shouldReduceMotion ? -8 : 0,
        scale: isHovered && !shouldReduceMotion ? 1.02 : 1,
        boxShadow: isHovered 
          ? "0 20px 40px -10px rgba(0,0,0,0.08)" 
          : "0 2px 10px -4px rgba(0,0,0,0.02)",
        background: isHovered 
          ? "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--primary)/0.03) 100%)" 
          : "hsl(var(--card))"
      }}
      style={{
        background: "hsl(var(--card))",
        flex: isHovered ? 2.2 : 1
      }}
    >
      <motion.div
        layout
        animate={{ 
          y: isHovered && !shouldReduceMotion ? -8 : 0,
          opacity: isHovered ? 0 : 1
        }}
        transition={premiumTransition}
        className="w-full flex flex-col items-center relative z-20"
      >
        <div className="w-16 h-16 bg-card border-2 border-border/80 text-foreground/80 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 bg-clip-padding transition-colors duration-300 group-hover:border-primary/50 group-hover:text-foreground">
          {step}
        </div>
        <h3 className="text-2xl font-bold mb-4 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed font-medium">
          {desc}
        </p>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-0 overflow-hidden"
          >
            <motion.img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.05 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AnimatedNumber = ({ end, duration = 1200 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(end);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTimestamp: number | null = null;
          // Use easeOutQuart easing for smoother counting
          const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easedProgress = easeOutQuart(progress);
            setCount(Math.floor(easedProgress * end));
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
  }, [end, duration, shouldReduceMotion]);

  return <span ref={ref}>{count}</span>;
};

const Index = () => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity1 = useTransform(scrollY, [0, 500], [1, 0]);
  
  const heroParallax = useTransform(scrollY, [0, 1000], [0, 300]);

  const howItWorksRef = useRef<HTMLElement>(null);
  const { scrollYProgress: howItWorksProgress } = useScroll({
    target: howItWorksRef,
    offset: ["start center", "end center"]
  });

  const ctaRef = useRef<HTMLElement>(null);
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"]
  });
  const ctaParallax = useTransform(ctaProgress, [0, 1], [-150, 150]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();
  const scrollTo = (index: number) => emblaApi && emblaApi.scrollTo(index);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setPrevBtnEnabled(emblaApi.canScrollPrev());
      setNextBtnEnabled(emblaApi.canScrollNext());
    };
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();

    const autoplay = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 2500);

    return () => clearInterval(autoplay);
  }, [emblaApi]);

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
    {
      id: "mentors",
      icon: Users,
      title: "Mentorship Hub",
      description: "Book 1-on-1 sessions with industry experts and alumni",
    },
    {
      id: "hostels",
      icon: Globe,
      title: "Campus Housing",
      description: "Find local hostels, PGs, and roommates near your college",
    },
    {
      id: "scholarships",
      icon: GraduationCap,
      title: "Scholarships",
      description: "Discover and apply for financial aid and academic scholarships",
    },
  ];

  const stats = [
    { label: "Active Students", value: 10, suffix: "K+", icon: Users },
    { label: "Study Resources", value: 5, suffix: "K+", icon: BookOpen },
    { label: "Events Listed", value: 500, suffix: "+", icon: Calendar },
    { label: "Success Stories", value: 2, suffix: "K+", icon: GraduationCap },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: shouldReduceMotion ? 0 : 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  const glowAnimation = shouldReduceMotion ? {} : {
    boxShadow: [
      "0px 0px 0px rgba(var(--primary-rgb), 0)",
      "0px 0px 20px rgba(var(--primary-rgb), 0.4)",
      "0px 0px 0px rgba(var(--primary-rgb), 0)"
    ],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-32 overflow-hidden bg-background">
        {/* Clean Hero Background Image */}
        <motion.div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={shouldReduceMotion ? {} : { y: heroParallax }}
        >
          <img src="/hero_bg_v2.jpg" alt="Hero background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/60" />
        </motion.div>

        <div className="container relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual */}
            <motion.div 
              className="lg:col-span-5 lg:order-2 w-full perspective-[1200px] relative z-10"
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 40, rotateY: shouldReduceMotion ? 0 : 15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            >
              {/* CSS Glow behind card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] z-0 pointer-events-none opacity-40 dark:opacity-60 bg-gradient-to-tr from-primary/40 to-blue-500/40 blur-[80px] rounded-full"></div>
              <motion.div 
                className="dashboard-card border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/40 dark:bg-black/40 backdrop-blur-xl relative z-10 rounded-2xl overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_8px_40px_rgba(var(--primary-rgb),0.15)]"
                whileHover={shouldReduceMotion ? {} : { scale: 1.01, rotateY: -2, rotateX: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-transparent -z-10 pointer-events-none"></div>
                
                <div className="p-5">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
                    <div className="text-title flex items-center gap-2 font-semibold text-foreground">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      Student Dashboard
                    </div>
                    <div className="flex gap-1.5" aria-hidden="true">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                    </div>
                  </div>
                  
                  {/* Faux UI Rows - Staggered entrance */}
                  <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={itemVariants} className="bg-background/60 backdrop-blur-md rounded-[var(--radius-sm)] border border-border/50 p-3 flex justify-between items-center shadow-sm">
                      <span className="text-sm font-medium text-muted-foreground">DSA Progress</span>
                      <span className="text-sm font-bold text-primary">47/150</span>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="w-full bg-muted/50 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
                      <motion.div 
                        className="bg-primary h-full rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: "31%" }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      />
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="bg-background/60 backdrop-blur-md rounded-[var(--radius-sm)] border border-border/50 p-4 mt-6 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Next Event</div>
                      <div className="text-base font-bold text-foreground mb-1">Campus Coding Hackathon</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Tomorrow, 10:00 AM
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-[var(--space-2)]">
                      <motion.div variants={itemVariants} className="bg-background/60 backdrop-blur-md rounded-[var(--radius-sm)] border border-border/50 p-3 shadow-sm transition-colors hover:bg-primary/5 cursor-default">
                         <div className="text-xs font-medium text-muted-foreground">Study Hours</div>
                         <div className="text-xl font-black text-foreground mt-1 tracking-tight">14.5h</div>
                      </motion.div>
                      <motion.div variants={itemVariants} className="bg-background/60 backdrop-blur-md rounded-[var(--radius-sm)] border border-border/50 p-3 shadow-sm transition-colors hover:bg-primary/5 cursor-default">
                         <div className="text-xs font-medium text-muted-foreground">New Notes</div>
                         <div className="text-xl font-black text-foreground mt-1 tracking-tight">8</div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Left Column (Text & CTAs) */}
            <motion.div 
              className="lg:col-span-7 lg:order-1 text-left w-full"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              style={shouldReduceMotion ? {} : { y: y1, opacity: opacity1 }}
            >
              <motion.div variants={itemVariants} className="mb-4 inline-flex items-center bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20 shadow-sm backdrop-blur-sm">
                <Zap className="w-4 h-4 mr-2" /> Your All-in-One Student Platform
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="mb-6 text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tighter leading-[1.1] md:leading-[1.05] text-foreground">
                Where Students <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 font-black text-6xl md:text-8xl lg:text-[6rem] inline-block pb-2 drop-shadow-sm">Succeed</span> Together
              </motion.h1>
              
              <motion.p variants={itemVariants} className="mb-8 max-w-xl text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                Connect, learn, and grow with a comprehensive platform designed for student success. Access notes, join events, find mentors, and build your career - all in one place.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-start">
                <Link to={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 text-lg group hover:-translate-y-0.5 hover:scale-105 hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 hover:bg-muted transition-all duration-300 text-lg group hover:-translate-y-0.5 hover:scale-105 hover:text-primary">
                    <Play className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" /> Watch Demo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Scroll Cue */}
        <motion.div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/60 flex flex-col items-center gap-2"
          animate={shouldReduceMotion ? {} : { y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-12 bg-zinc-950 dark:bg-zinc-950 border-y border-white/10 relative overflow-hidden">
        {/* Animated gradient sweep */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 opacity-50"
          animate={shouldReduceMotion ? {} : { x: ['-100%', '200%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
        
        <div className="container relative z-10">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
          >
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="flex flex-col items-center justify-center p-4" 
              >
                <div className="stat-number text-4xl md:text-5xl mb-2 font-black tracking-tighter text-white drop-shadow-md">
                  <AnimatedNumber end={stat.value} />{stat.suffix}
                </div>
                <div className="text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-widest">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="pt-12 pb-8 md:pt-20 md:pb-12 relative bg-muted/20">
        <div className="container">
          <motion.div 
            className="mb-16 max-w-5xl mx-auto text-center"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-foreground">Everything you need, in one workspace.</h2>
            <p className="text-lg md:text-xl text-muted-foreground font-medium">Replace five different tools with a single, seamlessly integrated platform designed specifically for how students actually work.</p>
          </motion.div>

          <div className="relative">
            <div 
              className="overflow-hidden cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl" 
              ref={emblaRef}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') scrollPrev();
                if (e.key === 'ArrowRight') scrollNext();
              }}
              aria-label="Features carousel"
            >
              <div className="flex -ml-4">
                {features.map((feature) => (
                  <div key={feature.id} className="min-w-0 shrink-0 grow-0 basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[30%] pl-4 pb-10">
                    <motion.div 
                      whileHover={shouldReduceMotion ? {} : { y: -6 }}
                      className="group p-8 h-full flex flex-col rounded-2xl bg-card border border-border shadow-sm hover:shadow-[0_12px_40px_rgba(var(--primary-rgb),0.08)] hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Glow effect on border */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl ring-1 ring-inset ring-primary/20"></div>
                      
                      <div className="mb-6 flex items-center justify-start">
                        <motion.div 
                          className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                          whileHover={shouldReduceMotion ? {} : { rotate: [0, -10, 10, 0], scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <feature.icon className="h-6 w-6" strokeWidth={2} />
                        </motion.div>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">{feature.title}</h3>
                      <p className="text-sm mb-8 text-muted-foreground leading-relaxed">{feature.description}</p>
                      
                      <div className="mt-auto pt-5 border-t border-border group-hover:border-primary/10 transition-colors">
                        <Link to={`/${feature.id === 'career' ? 'dashboard' : feature.id}`} className="inline-flex items-center text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          Explore {feature.title} 
                          <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-10 hidden sm:block">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-10 h-10 bg-background shadow-md disabled:opacity-50 hover:bg-muted"
                onClick={scrollPrev}
                disabled={!prevBtnEnabled}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 z-10 hidden sm:block">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-10 h-10 bg-background shadow-md disabled:opacity-50 hover:bg-muted"
                onClick={scrollNext}
                disabled={!nextBtnEnabled}
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-2">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === selectedIndex ? 'bg-primary w-6' : 'bg-primary/20'}`}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section ref={howItWorksRef} className="pt-16 pb-12 md:pt-20 md:pb-16 bg-background border-t">
        <div className="container">
          <motion.div 
            className="mb-12 max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground">How StudentHub Works</h2>
            <p className="text-xl text-muted-foreground font-medium">Join thousands of students who are already advancing their careers and academics.</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12 relative max-w-[1400px] mx-auto items-stretch h-[800px] md:h-[480px]">
            {/* The progressive drawing line */}
            <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-muted -z-10">
              <motion.div 
                className="h-full bg-primary origin-left"
                style={{ scaleX: howItWorksProgress }}
              />
            </div>
            
            {[
              { step: 1, title: "Create Your Profile", desc: "Sign up and set your academic goals, interests, and career aspirations.", image: "/image1.png" },
              { step: 2, title: "Connect & Learn", desc: "Join study groups, access notes, and participate in community forums.", image: "/image2.png" },
              { step: 3, title: "Achieve Success", desc: "Find internships, ace interviews, and launch your career with confidence.", image: "/image3.png" },
            ].map((item, i) => (
              <HowItWorksCard 
                key={i} 
                index={i}
                step={item.step}
                title={item.title}
                desc={item.desc}
                image={item.image}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-12 md:py-16 relative overflow-hidden border-t">
        {/* Image Background (Parallax) */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={shouldReduceMotion ? {} : { y: ctaParallax }}
        >
          <img src="/cta_bg_v2.jpg" alt="Students celebrating" className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-[1.2]" />
        </motion.div>
        <div className="absolute inset-0 bg-zinc-950/70 dark:bg-black/70 z-0"></div>
        {/* Dark radial glow behind text to ensure contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.6)_0%,_rgba(0,0,0,0.95)_100%)] z-0 pointer-events-none"></div>
        
        <div className="container relative z-10">
          <motion.div 
            className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight text-white drop-shadow-md">
                Ready to transform your student experience?
              </h2>
              <p className="text-lg text-zinc-300 font-medium drop-shadow-md max-w-2xl mx-auto lg:mx-0">
                Join the fastest growing student platform and get access to all the resources you need to succeed.
              </p>
            </div>
            
            <div className="flex flex-col items-center lg:items-end gap-5">
              <Link to="/auth">
                <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold px-8 shadow-xl transition-all hover:-translate-y-0.5">
                  Create Your Account
                </Button>
              </Link>
              <div className="flex flex-col gap-2 text-sm font-medium text-zinc-400 text-center lg:text-right">
                <div className="flex items-center gap-2 justify-center lg:justify-end"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Access 10,000+ Notes & Guides</div>
                <div className="flex items-center gap-2 justify-center lg:justify-end"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exclusive Job & Internship Board</div>
                <div className="flex items-center gap-2 justify-center lg:justify-end"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Vibrant Student Community</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-muted/10">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <div className="mb-6 flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-fraunces font-black text-2xl tracking-tight text-foreground">StudentHub</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-medium">
                Empowering students with the tools they need to succeed in their academic and professional journeys.
              </p>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-lg text-foreground">Platform</h4>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground font-medium">
                <li><Link to="/notes" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Notes Hub</Link></li>
                <li><Link to="/events" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Events & Hackathons</Link></li>
                <li><Link to="/community" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Community Forum</Link></li>
                <li><Link to="/innovation" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Innovation Hub</Link></li>
                <li><Link to="/study" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Study Groups</Link></li>
                <li><Link to="/dashboard" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Career Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-lg text-foreground">Resources</h4>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground font-medium">
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Documentation</a></li>
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Tutorials</a></li>
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Blog</a></li>
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-lg text-foreground">Company</h4>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground font-medium">
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> About</a></li>
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Careers</a></li>
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Privacy</a></li>
                <li><a href="#" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-medium">
            <div>© 2026 StudentHub. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="hover-underline hover:text-primary transition-colors w-fit">Privacy Policy</a>
              <a href="#" className="hover-underline hover:text-primary transition-colors w-fit">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
