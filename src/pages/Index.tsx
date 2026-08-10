import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ChevronRight,
  Lock,
  PlayCircle,
  Mail,
  ShieldCheck,
  Check,
  X,
  ArrowUp
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence, animate, useInView, useMotionValue, useSpring } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const premiumTransition = { duration: 0.85, ease: [0.16, 1, 0.3, 1] };
const masterEasing = [0.16, 1, 0.3, 1];

const HowItWorksCard = ({ step, title, desc, image, index, shouldReduceMotion }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[24px] border border-border/50 bg-card p-8 text-center flex flex-col items-center will-change-transform z-10 cursor-pointer"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay: isHovered ? 0 : index * 0.2 + 0.1, ...premiumTransition, layout: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      animate={{
        y: isHovered ? -8 : 0,
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered 
          ? "0 20px 40px -10px rgba(0,0,0,0.08)" 
          : "0 2px 10px -4px rgba(0,0,0,0.02)"
      }}
      style={{
        background: "hsl(var(--card))",
        flex: isHovered ? 3 : 1
      }}
    >
      <motion.div
        layout
        animate={{ 
          y: isHovered ? -8 : 0,
          opacity: isHovered ? 0 : 1
        }}
        transition={shouldReduceMotion ? { duration: 0 } : { ...premiumTransition, layout: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
        className="w-full flex flex-col items-center relative z-20"
      >
        <motion.div 
          className="w-16 h-16 bg-card border-2 border-border/80 text-foreground/80 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 bg-clip-padding transition-colors duration-300 group-hover:border-primary/50 group-hover:text-foreground relative"
          animate={shouldReduceMotion ? {} : { 
            boxShadow: [
              "0px 0px 0px 0px rgba(200, 200, 200, 0)",
              "0px 0px 20px 0px rgba(200, 200, 200, 0.15)",
              "0px 0px 0px 0px rgba(200, 200, 200, 0)"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {step}
        </motion.div>
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
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-0 overflow-hidden"
          >
            <motion.img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top blur-up"
              onLoad={(e) => (e.target as HTMLImageElement).classList.add("loaded")}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.05 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AnimatedNumber = ({ end, duration = 1.5 }: { end: number, duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const count = useMotionValue(0);
  const formatted = useTransform(count, (latest) => Math.floor(latest).toLocaleString());
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(end);
      return;
    }
    
    if (isInView) {
      animate(count, end, { duration: duration, ease: "easeOut" });
    }
  }, [isInView, end, duration, count, shouldReduceMotion]);

  return <motion.span ref={ref}>{formatted}</motion.span>;
};

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setStatsLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);
  
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { scrollY } = useScroll();
  
  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setShowBackToTop(latest > 600);
    });
  }, [scrollY]);
  
  // Custom Analytics Track Simulator
  const trackEvent = (eventName: string, data?: any) => {
    console.log(`[Analytics] ${eventName}`, data || {});
  };

  const handleNavigate = (path: string, eventName?: string) => {
    if (eventName) trackEvent(eventName, { path });
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
      window.scrollTo(0, 0);
    }, 300);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      trackEvent('newsletter_subscribe');
      toast.success("Subscribed! We'll send you the best tips weekly.");
      setNewsletterEmail("");
    }
  };

  const shouldReduceMotion = useReducedMotion();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity1 = useTransform(scrollY, [0, 500], [1, 0]);
  
  const heroParallax = useTransform(scrollY, [0, 1000], [0, 500]);

  // Hero Card 3D Tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-400, 400], [5, -5]), { damping: 30, stiffness: 200 });
  const rotateY = useSpring(useTransform(mouseX, [-400, 400], [-5, 5]), { damping: 30, stiffness: 200 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!shouldReduceMotion && window.matchMedia("(pointer: fine)").matches) {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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
  const ctaParallax = useTransform(ctaProgress, [0, 1], [-250, 250]);

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
    { label: "Active Students", value: 12432, suffix: "+", icon: Users },
    { label: "Study Resources", value: 5891, suffix: "+", icon: BookOpen },
    { label: "Events Listed", value: 542, suffix: "+", icon: Calendar },
    { label: "Success Stories", value: 1893, suffix: "+", icon: GraduationCap },
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

  const dashboardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.9
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
    <AnimatePresence mode="wait">
      <motion.div 
        key="index-page"
        id="main-content"
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="relative min-h-screen overflow-hidden"
      >
      <Header />

      {/* Hero Section */}
      <section 
        className="relative pt-12 pb-16 md:pt-20 md:pb-32 overflow-hidden bg-background"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Clean Hero Background Image */}
        <motion.div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={(shouldReduceMotion || isMobile) ? {} : { y: heroParallax }}
        >
          <img src="/hero_bg_v2.jpg" alt="Hero background" className="w-full h-full object-cover scale-[1.1]" />
          <div className="absolute inset-0 bg-background/60" />
        </motion.div>

        <div className="container relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual */}
            <motion.div 
              className="lg:col-span-5 lg:order-2 w-full perspective-[1200px] relative z-10"
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: masterEasing, delay: 0.7 }}
              style={shouldReduceMotion ? {} : { rotateX, rotateY }}
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
                    variants={dashboardContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={itemVariants} className="bg-background/60 backdrop-blur-md rounded-[var(--radius-sm)] border border-border/50 p-3 flex justify-between items-center shadow-sm">
                      <span className="text-sm font-medium text-muted-foreground">DSA Progress</span>
                      <AnimatePresence mode="wait">
                        {!statsLoaded ? (
                          <motion.div key="skel1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Skeleton className="h-5 w-12 rounded-sm" /></motion.div>
                        ) : (
                          <motion.div key="data1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Tooltip>
                              <TooltipTrigger className="text-sm font-bold text-primary cursor-help">47/150</TooltipTrigger>
                              <TooltipContent>47 out of 150 problems completed</TooltipContent>
                            </Tooltip>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="w-full bg-muted/50 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
                      <motion.div 
                        className="bg-primary h-full rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: statsLoaded ? "31%" : "0%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="bg-background/60 backdrop-blur-md rounded-[var(--radius-sm)] border border-border/50 p-4 mt-6 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Next Event</div>
                      <AnimatePresence mode="wait">
                        {!statsLoaded ? (
                          <motion.div key="skel2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                            <Skeleton className="h-6 w-3/4 rounded-sm" />
                            <Skeleton className="h-4 w-1/2 rounded-sm" />
                          </motion.div>
                        ) : (
                          <motion.div key="data2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="text-base font-bold text-foreground mb-1">Campus Coding Hackathon</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-4 h-4" /> Tomorrow, 10:00 AM
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                          <BookOpen className="w-5 h-5 text-primary/50" />
                        </div>
                        <div>
                          <div className="h-4 w-24 bg-foreground/10 rounded-full mb-1 animate-pulse"></div>
                          <div className="h-3 w-32 bg-muted-foreground/10 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-foreground/5 animate-pulse"></div>
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
              style={shouldReduceMotion ? {} : { y: y1, opacity: opacity1 }}
            >
              <motion.div 
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.15, ease: masterEasing }}
                className="mb-4 inline-flex items-center bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20 shadow-sm backdrop-blur-sm"
              >
                <Zap className="w-4 h-4 mr-2" /> Your All-in-One Student Platform
              </motion.div>
              
              <motion.h1 
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(10px)", y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: masterEasing }}
                className="mb-6 text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tighter leading-[1.1] md:leading-[1.05] text-foreground"
              >
                Where Students <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 font-black text-6xl md:text-8xl lg:text-[6rem] inline-block pb-2 drop-shadow-sm">Succeed</span> Together
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.5, ease: masterEasing }}
                className="mb-8 max-w-xl text-lg md:text-xl text-muted-foreground leading-relaxed font-medium"
              >
                Connect, learn, and grow with a comprehensive platform designed for student success. Access notes, join events, find mentors, and build your career - all in one place.
              </motion.p>
              
              <motion.div 
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.65 }}
                className="flex flex-col sm:flex-row gap-4 justify-start"
              >
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Button onClick={() => handleNavigate(user ? "/dashboard" : "/auth", "click_get_started_hero")} size="lg" className="w-full h-14 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 text-lg group hover:-translate-y-0.5 hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Button onClick={() => { trackEvent('click_watch_demo'); setShowDemoModal(true); }} size="lg" variant="outline" className="w-full h-14 px-8 hover:bg-muted transition-all duration-300 text-lg group hover:-translate-y-0.5 hover:text-primary">
                    <Play className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" /> Watch Demo
                  </Button>
                </motion.div>
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

      {/* Social Proof Marquee */}
      <section className="py-8 bg-background border-y border-border overflow-hidden">
        <div className="container px-4">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">Trusted by students from</p>
          <div className="relative flex overflow-x-hidden group">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
            <motion.div 
              className="flex items-center gap-16 whitespace-nowrap px-8"
              animate={shouldReduceMotion ? {} : { x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
            >
              {[
                "Stanford University", "MIT", "Harvard University", "UC Berkeley", 
                "Oxford University", "IIT Bombay", "University of Toronto", "ETH Zurich", 
                "National University of Singapore",
                // Duplicate for seamless infinite scroll
                "Stanford University", "MIT", "Harvard University", "UC Berkeley", 
                "Oxford University", "IIT Bombay", "University of Toronto", "ETH Zurich", 
                "National University of Singapore"
              ].map((uni, i) => (
                <div key={i} className="text-2xl font-black text-muted-foreground/30 select-none shrink-0">{uni}</div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 md:py-8 bg-zinc-950 dark:bg-zinc-950 border-y border-white/10 relative overflow-hidden">
        {/* Animated gradient sweep */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 opacity-20"
          animate={shouldReduceMotion ? {} : { x: ['-100%', '200%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
        
        <div className="container relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center justify-center p-2" 
              >
                <div className="stat-number text-3xl md:text-4xl mb-1.5 font-black tracking-tighter text-white drop-shadow-md">
                  <AnimatedNumber end={stat.value} duration={2} />{stat.suffix}
                </div>
                <div className="text-xs font-bold text-white/60 flex items-center gap-1.5 uppercase tracking-widest">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
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
                {features.map((feature, index) => (
                  <motion.div 
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: masterEasing }}
                    key={feature.id} 
                    className="min-w-0 shrink-0 grow-0 basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[30%] pl-4 pb-10"
                  >
                    <Link to={`/${feature.id === 'career' ? 'dashboard' : feature.id}`} className="block h-full outline-none">
                      <motion.div 
                        whileHover={shouldReduceMotion ? {} : { y: -6 }}
                        className="group p-8 h-full flex flex-col rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50 transition-all duration-300 relative overflow-hidden cursor-pointer"
                      >
                        {/* Glow effect on border */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl ring-1 ring-inset ring-primary/20"></div>
                        
                        <div className="mb-6 flex items-center justify-start">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-6">
                            <feature.icon className="h-6 w-6" strokeWidth={2} />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-foreground transition-colors">{feature.title}</h3>
                        <p className="text-sm mb-8 text-muted-foreground leading-relaxed">{feature.description}</p>
                        
                        <div className="mt-auto pt-5 border-t border-border group-hover:border-primary/10 transition-colors">
                          <span className="inline-flex items-center text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                            Explore {feature.title} 
                            <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-10 hidden sm:block">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-10 h-10 bg-background shadow-md disabled:opacity-50 hover:bg-muted hover:scale-105 active:scale-95 transition-all duration-200"
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
                className="rounded-full w-10 h-10 bg-background shadow-md disabled:opacity-50 hover:bg-muted hover:scale-105 active:scale-95 transition-all duration-200"
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
                  className={`w-2 h-2 rounded-full transition-all duration-300 ease-out ${index === selectedIndex ? 'bg-primary w-6' : 'bg-primary/20'}`}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section ref={howItWorksRef} className="relative pt-16 pb-12 md:pt-20 md:pb-16 bg-background border-t">
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
            <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-muted -z-10">
              <motion.div 
                className="h-full bg-primary origin-left"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
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

      {/* Comparison Section */}
      <section className="py-12 md:py-16 bg-background border-t border-border">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-headline mb-4">Why StudentHub?</h2>
            <p className="text-lg text-muted-foreground">The only platform built specifically for your academic journey.</p>
          </div>
          <div className="max-w-4xl mx-auto border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-muted/30 border-b border-border p-4 font-bold">
              <div>Features</div>
              <div className="text-primary text-center">StudentHub</div>
              <div className="text-muted-foreground text-center">Others</div>
            </div>
            {['Verified Study Materials', 'Campus Specific Events', 'Student-only Community', 'Academic Mentorship', '100% Free for Students'].map((feat, i) => (
              <div key={i} className="grid grid-cols-3 p-4 border-b border-border/50 hover:bg-muted/10 transition-colors">
                <div className="font-medium text-foreground">{feat}</div>
                <div className="flex justify-center"><Check className="text-primary w-5 h-5" /></div>
                <div className="flex justify-center"><X className="text-muted-foreground/30 w-5 h-5" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-muted/30 border-t border-border">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="section-headline mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know about the platform.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold">Is it really free?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">Yes, StudentHub is completely free for all verified students.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-semibold">Do I need a university email?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">While not strictly required for browsing, a .edu or institutional email verifies your student status to access exclusive resources and jobs.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-semibold">How is this different from LinkedIn or Discord?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">We combine the professional networking of LinkedIn with the real-time community feel of Discord, but filtered entirely for academics, notes, and campus life.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section ref={ctaRef} className="py-24 bg-zinc-950 relative overflow-hidden border-t">
        {/* Image Background (Parallax) */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={(shouldReduceMotion || isMobile) ? {} : { y: ctaParallax }}
        >
          <img src="/cta_bg_v2.jpg" alt="Students celebrating" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-[1.2] blur-up" onLoad={(e) => (e.target as HTMLImageElement).classList.add("loaded")} />
        </motion.div>
        <div className="absolute inset-0 bg-zinc-950/70 dark:bg-black/70 z-0"></div>
        {/* Dark radial glow behind text to ensure contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.6)_0%,_rgba(0,0,0,0.95)_100%)] z-0 pointer-events-none"></div>
        
        <div className="container relative z-10">
          <motion.div 
            className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={shouldReduceMotion ? {} : {
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            <div className="flex-1 text-center lg:text-left">
              <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: masterEasing, duration: 0.5 } } }} className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight text-white drop-shadow-md">
                Ready to transform your student experience?
              </motion.h2>
              <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: masterEasing, duration: 0.5 } } }} className="text-lg text-zinc-300 font-medium drop-shadow-md max-w-2xl mx-auto lg:mx-0">
                Join the fastest growing student platform and get access to all the resources you need to succeed.
              </motion.p>
            </div>
            
            <div className="flex flex-col items-center lg:items-end gap-5">
              <Link to="/auth">
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { ease: masterEasing, duration: 0.5 } } }}>
                  <motion.div whileTap={{ scale: 0.95 }} className="w-full md:w-auto inline-block">
                    <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold px-8 shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 w-full md:w-auto h-14 text-lg">
                      Create Your Account
                    </Button>
                  </motion.div>
                </motion.div>
              </Link>
              <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="flex items-center gap-3 text-sm text-zinc-400 mt-2">
                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Secure</span>
                <span>•</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Trusted by 10K+ Students</span>
              </motion.div>
              <div className="flex flex-col gap-2 text-sm font-medium text-zinc-400 text-center lg:text-right">
                <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { ease: masterEasing, duration: 0.5 } } }} className="flex items-center gap-2 justify-center lg:justify-end"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Access 10,000+ Notes & Guides</motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { ease: masterEasing, duration: 0.5 } } }} className="flex items-center gap-2 justify-center lg:justify-end"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exclusive Job & Internship Board</motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { ease: masterEasing, duration: 0.5 } } }} className="flex items-center gap-2 justify-center lg:justify-end"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Vibrant Student Community</motion.div>
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
                <li><Link to="/innovation-hub" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Innovation Hub</Link></li>
                <li><Link to="/study-groups" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Study Groups</Link></li>
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
                <li><Link to="/privacy" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Privacy</Link></li>
                <li><Link to="/terms" className="hover-underline hover:text-primary transition-colors flex items-center gap-2 group w-fit"><ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/> Terms</Link></li>
              </ul>
              
              <div className="mt-8">
                <h4 className="mb-3 font-bold text-sm text-foreground">Subscribe to our Newsletter</h4>
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="secondary">Subscribe</Button>
                </form>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-medium">
            <div>© 2026 StudentHub. All rights reserved.</div>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover-underline hover:text-primary transition-colors w-fit">Privacy Policy</Link>
              <Link to="/terms" className="hover-underline hover:text-primary transition-colors w-fit">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-4xl aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
              <Play className="w-16 h-16 opacity-20 text-white mb-4" />
              <p className="text-white/50 font-medium">Demo Video Placeholder</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all border border-primary/20 backdrop-blur-md"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;
