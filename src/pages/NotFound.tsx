import { useEffect, useState, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, Compass, BookOpen, Laptop, Coffee, FileText, Search, Flag, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FloatingIcon = ({ 
  id,
  icon: Icon, 
  delay = 0, 
  duration = 4, 
  xOffset = 10, 
  yOffset = 10, 
  className,
  tooltip,
  mouseX,
  mouseY,
  isCollected,
  nodeRef
}: any) => {
  const shouldReduceMotion = useReducedMotion();
  
  // Very subtle cursor repulsion effect
  const pushX = useTransform(mouseX, [-800, 800], [-30, 30]);
  const pushY = useTransform(mouseY, [-800, 800], [-30, 30]);
  
  return (
    <AnimatePresence>
      {!isCollected && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                ref={nodeRef}
                className={`absolute text-primary/40 ${className}`}
                style={shouldReduceMotion ? {} : { x: pushX, y: pushY }}
                animate={shouldReduceMotion ? {} : {
                  y: [0, -yOffset, 0],
                  x: [0, xOffset, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
                whileHover={shouldReduceMotion ? {} : { scale: 1.2, rotate: 10, zIndex: 50, color: "hsl(var(--primary))" }}
                exit={{ scale: 0, opacity: 0, rotate: 180, transition: { duration: 0.3 } }}
              >
                <Icon className="w-8 h-8 md:w-12 md:h-12 drop-shadow-sm" />
              </motion.div>
            </TooltipTrigger>
            {tooltip && (
              <TooltipContent side="top" className="bg-primary text-primary-foreground border-none font-medium">
                <p>{tooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
};

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [headline, setHeadline] = useState("");
  
  // Mini-game state
  const [collected, setCollected] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLImageElement>(null);
  const objRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    // 1. Visit Count Logic
    const visits = parseInt(sessionStorage.getItem('404_visits') || '0') + 1;
    sessionStorage.setItem('404_visits', visits.toString());

    // 2. Time of Day Logic
    const hour = new Date().getHours();
    
    // 3. Dynamic Referrer Logic
    const isInternal = document.referrer.includes(window.location.hostname);

    let newHeadline = "Looks like you took a wrong turn on campus.";
    
    if (visits > 2) {
      newHeadline = "Wow, lost again? Let's actually get you there this time.";
    } else if (isInternal) {
      newHeadline = "Whoops, that internal link seems to be broken.";
    } else if (hour < 5 || hour > 22) {
      newHeadline = "Burning the midnight oil and still ended up here?";
    } else if (hour > 5 && hour < 9) {
      newHeadline = "Early start, wrong turn. Let's get you coffee and back on track.";
    }

    setHeadline(newHeadline);
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

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

  const triggerConfettiAt = (rect: DOMRect) => {
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { x, y },
      colors: ['#facc15', '#3b82f6', '#f43f5e'],
      disableForReducedMotion: true
    });
  };

  // Mini-game Collision Loop (on drag)
  const handleDrag = () => {
    if (!charRef.current) return;
    const charRect = charRef.current.getBoundingClientRect();

    // Shrink the hitbox slightly so it feels fair
    const hitbox = {
      left: charRect.left + 40,
      right: charRect.right - 40,
      top: charRect.top + 40,
      bottom: charRect.bottom - 40
    };

    const ids = ['book', 'laptop', 'coffee', 'file'];
    ids.forEach(id => {
      if (collected.includes(id)) return;
      const objNode = objRefs.current[id];
      if (!objNode) return;
      
      const objRect = objNode.getBoundingClientRect();
      if (
        hitbox.left < objRect.right &&
        hitbox.right > objRect.left &&
        hitbox.top < objRect.bottom &&
        hitbox.bottom > objRect.top
      ) {
        setCollected(prev => {
          const next = [...prev, id];
          triggerConfettiAt(objRect);
          
          if (next.length === ids.length) {
            // Found all!
            setTimeout(() => {
              confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                disableForReducedMotion: true
              });
              toast.success("Nice, you found everything except the way home 😄 Let's fix that.", {
                icon: <Sparkles className="text-amber-500 w-5 h-5" />,
                duration: 5000
              });
            }, 300);
          }
          return next;
        });
      }
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied! Share how lost you got on StudentHub 😅");
    } catch (err) {
      // fallback
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const masterEasing = [0.16, 1, 0.3, 1];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: masterEasing } }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden flex flex-col">
      <Header />
      
      <main 
        className="flex-1 relative flex flex-col items-center justify-center pt-16 pb-24 px-4 md:px-8 z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Ambient Background Gradient (matching Homepage Hero) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-4xl h-[80vh] z-0 opacity-30 dark:opacity-40 bg-gradient-to-tr from-primary/30 to-blue-500/20 blur-[120px] rounded-full transition-colors duration-500"></div>
        </div>

        <motion.div 
          className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Left Column: Illustration & Floating Elements (Mini-Game Area) */}
          <motion.div 
            variants={itemVariants}
            ref={containerRef}
            className="relative order-2 lg:order-1 w-full max-w-[320px] sm:max-w-md lg:max-w-lg aspect-square flex items-center justify-center"
          >
            {/* The character illustration - Draggable! */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.img 
                    ref={charRef}
                    drag
                    dragConstraints={containerRef}
                    dragElastic={0.2}
                    onDrag={handleDrag}
                    whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                    src="/404-illustration.jpg" 
                    alt="Confused student looking at map" 
                    className="w-full h-full object-contain rounded-3xl mix-blend-multiply dark:mix-blend-normal shadow-sm dark:shadow-none ring-1 ring-border/20 dark:ring-white/10 cursor-grab relative z-20"
                    animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-primary text-primary-foreground font-medium">
                  <p>Drag me around to collect lost items!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Floating Objects with Tooltips and Cursor Interaction */}
            <FloatingIcon 
              id="book" nodeRef={(el: HTMLDivElement) => objRefs.current['book'] = el}
              icon={BookOpen} delay={0} duration={4} yOffset={15} xOffset={10} 
              className="-top-4 -left-4 md:-top-8 md:-left-8" 
              tooltip="Flipping to page 404..."
              mouseX={mouseX} mouseY={mouseY} isCollected={collected.includes('book')}
            />
            <FloatingIcon 
              id="laptop" nodeRef={(el: HTMLDivElement) => objRefs.current['laptop'] = el}
              icon={Laptop} delay={1} duration={5} yOffset={20} xOffset={-15} 
              className="top-1/4 -right-8 md:-right-12" 
              tooltip="Have you tried turning it off and on?"
              mouseX={mouseX} mouseY={mouseY} isCollected={collected.includes('laptop')}
            />
            <FloatingIcon 
              id="coffee" nodeRef={(el: HTMLDivElement) => objRefs.current['coffee'] = el}
              icon={Coffee} delay={0.5} duration={3.5} yOffset={12} xOffset={5} 
              className="-bottom-6 left-10 md:-bottom-10 md:left-16 text-amber-600/40" 
              tooltip="Still warm ☕"
              mouseX={mouseX} mouseY={mouseY} isCollected={collected.includes('coffee')}
            />
            <FloatingIcon 
              id="file" nodeRef={(el: HTMLDivElement) => objRefs.current['file'] = el}
              icon={FileText} delay={2} duration={6} yOffset={25} xOffset={-20} 
              className="-bottom-2 -right-4 md:-bottom-6 md:-right-8 text-blue-500/40" 
              tooltip="Lost assignment"
              mouseX={mouseX} mouseY={mouseY} isCollected={collected.includes('file')}
            />
          </motion.div>

          {/* Right Column: Copy & CTAs */}
          <div className="order-1 lg:order-2 text-center lg:text-left max-w-xl w-full">
            <motion.div variants={itemVariants} className="mb-2">
              <span className="font-fraunces font-black text-7xl sm:text-8xl md:text-[8rem] leading-none text-foreground tracking-tighter drop-shadow-sm">
                404
              </span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="font-fraunces text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight leading-tight text-balance"
            >
              {headline}
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg text-muted-foreground font-medium mb-8 leading-relaxed text-balance"
            >
              The page you're looking for wandered off. Let's get you back to where you belong.
            </motion.p>
            
            {/* Search Bar Recovery Path */}
            <motion.form 
              variants={itemVariants}
              onSubmit={handleSearch}
              className="relative max-w-md mx-auto lg:mx-0 mb-8 flex items-center"
            >
              <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Looking for something specific? Search here..." 
                className="w-full pl-12 pr-4 py-6 rounded-xl border-border bg-card shadow-sm text-base focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm" className="absolute right-2 h-9 rounded-lg px-4 hidden sm:flex">
                Search
              </Button>
            </motion.form>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10"
            >
              <motion.button whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full h-14 px-8 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group hover:bg-primary/90 rounded-xl"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Button>
              </motion.button>
              
              <motion.button whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full h-14 px-8 text-lg hover:-translate-y-0.5 transition-all group border-border hover:bg-muted rounded-xl"
                  onClick={() => navigate('/events')} 
                >
                  <Compass className="mr-2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  Explore StudentHub
                </Button>
              </motion.button>
            </motion.div>

            {/* Smart Suggested Links & Actions */}
            <motion.div variants={itemVariants} className="pt-6 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mr-2 self-center hidden sm:block">Quick Links</span>
                  <Link to="/notes">
                    <Button variant="secondary" size="sm" className="rounded-full text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                      Notes Hub
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="secondary" size="sm" className="rounded-full text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                      Placement Prep
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button 
                    onClick={handleShare}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <button 
                    onClick={() => toast.success("Thanks! We've logged this broken link and our team will investigate.", { icon: <Flag className="w-4 h-4 text-emerald-500" /> })}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report Link
                  </button>
                </div>
              </div>
              
              <div className="mt-6 text-center lg:text-left">
                <p className="text-xs text-muted-foreground/60">
                  You and {Math.floor(Math.random() * 50) + 12} other students got lost here this week. It happens.
                </p>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;
