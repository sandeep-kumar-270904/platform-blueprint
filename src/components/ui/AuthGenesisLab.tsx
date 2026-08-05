import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { BookOpen, Activity } from 'lucide-react';

export const AuthGenesisLab = ({ isMobile }: { isMobile: boolean }) => {
  const shouldReduceMotion = useReducedMotion();
  const disableAnim = isMobile || shouldReduceMotion;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Orchestration Sequence State
  const [sequenceStep, setSequenceStep] = useState(0);
  
  // Magnetic particle tracking
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // Parallax Engine
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 25 });
  
  const imageX = useTransform(springX, [-1000, 1000], [15, -15]);
  const imageY = useTransform(springY, [-1000, 1000], [15, -15]);
  const hudX = useTransform(springX, [-1000, 1000], [-25, 25]);
  const hudY = useTransform(springY, [-1000, 1000], [-25, 25]);

  useEffect(() => {
    if (disableAnim) {
      setSequenceStep(4);
      return;
    }
    const seq = [
      setTimeout(() => setSequenceStep(1), 100),  // 1: Begin fade in of image
      setTimeout(() => setSequenceStep(2), 1200), // 2: Image fully visible 
      setTimeout(() => setSequenceStep(3), 1500), // 3: core ignites (particles & HUD)
      setTimeout(() => setSequenceStep(4), 2200), // 4: copy fades in
    ];
    return () => seq.forEach(clearTimeout);
  }, [disableAnim]);

  // Magnetic Core Particle Canvas
  useEffect(() => {
    if (disableAnim || sequenceStep < 3) return; 
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    interface Mote {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number;
      opacity: number; baseSpeedY: number;
    }

    const motes: Mote[] = [];

    // Core emission point (Center Robot Area)
    for (let i = 0; i < 35; i++) {
      motes.push({
        x: (canvas.width * 0.5) + (Math.random() * 60 - 30),
        y: (canvas.height * 0.45) + (Math.random() * 60 - 30),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.5 + 0.2), 
        baseSpeedY: -(Math.random() * 0.5 + 0.2),
        life: Math.random() * 200, 
        maxLife: 300 + Math.random() * 200,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }

    // Ambient emission (Full Panel Width)
    for (let i = 0; i < 45; i++) {
      motes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.3 + 0.1), 
        baseSpeedY: -(Math.random() * 0.3 + 0.1),
        life: Math.random() * 400, 
        maxLife: 400 + Math.random() * 300,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    const draw = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentCoreX = canvas.width * 0.5;
      const currentCoreY = canvas.height * 0.45;

      motes.forEach((m, index) => {
        m.life += 1;
        
        if (m.life >= m.maxLife) {
          m.life = 0;
          if (index < 35) {
            // Respawn at core
            m.x = currentCoreX + (Math.random() * 60 - 30);
            m.y = currentCoreY + (Math.random() * 60 - 30);
          } else {
            // Respawn at bottom randomly across full width
            m.x = Math.random() * canvas.width;
            m.y = canvas.height + 20;
          }
        }

        // Calculate magnetic pull to mouse
        const dx = mouseRef.current.x - m.x;
        const dy = mouseRef.current.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 250) {
          const pull = (250 - dist) / 250;
          m.vx += (dx / dist) * pull * 0.04;
          m.vy += (dy / dist) * pull * 0.04;
        }

        // Friction and base upward drift
        m.vx *= 0.95;
        m.vy = m.vy * 0.95 + m.baseSpeedY * 0.05;
        
        // Organic horizontal drift
        m.vx += Math.sin(time * 0.01 + m.life * 0.05) * 0.02;

        m.x += m.vx;
        m.y += m.vy;

        // Fade in and out
        const progress = m.life / m.maxLife;
        const currentOpacity = Math.sin(progress * Math.PI) * m.opacity;

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 162, 76, ${currentOpacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(212, 162, 76, ${currentOpacity})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (!document.hidden) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const handleVisibilityChange = () => { if (!document.hidden) draw(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [disableAnim, sequenceStep]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // For magnetic particles
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // For parallax
    if (!disableAnim) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      mouseX.set(e.clientX - rect.left - centerX);
      mouseY.set(e.clientY - rect.top - centerY);
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
    mouseX.set(0);
    mouseY.set(0);
  };

  // Typography stagger sequence
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25, // Deliberate choreography
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const lineDrawVariant = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { 
      scaleX: 1, 
      opacity: 0.8,
      transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 } 
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0604] cursor-default"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Hero Image Layer (with Parallax) */}
      <motion.div
        className="absolute inset-[-5%] w-[110%] h-[110%]" // Scaled up slightly to hide edges during parallax
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: sequenceStep >= 1 ? 1 : 0, scale: sequenceStep >= 1 ? 1 : 1.05 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={disableAnim ? {} : { x: imageX, y: imageY }}
      >
        <img 
          src="/genesis_lab_hero.jpg" 
          alt="The Genesis Lab" 
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* 2. Top Anchor Scrim (For Logo) */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0a0604]/80 to-transparent pointer-events-none z-40" />

      {/* Persistent NotesHub Logo */}
      <div className="absolute top-8 left-8 z-50 pointer-events-none flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-[#D4A24C]" strokeWidth={2.5} />
        <span className="font-serif font-bold text-lg text-[#FFF8D6] tracking-tight">NotesHub</span>
      </div>

      {/* 3. Dark Espresso Gradient Overlay for Text Contrast (Bottom) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-10 bg-gradient-to-t from-[#050302] via-[#050302]/70 to-transparent" />
      
      {/* 4. Cinematic Vignette */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-10 shadow-[inset_0_0_150px_rgba(5,3,2,0.95)]" />

      {/* Breathing Light Pulse Overlay (top center spotlight) */}
      <motion.div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full bg-[#D4A24C] blur-[120px] pointer-events-none z-10 mix-blend-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: sequenceStep >= 1 ? [0, 0.05, 0.02, 0.04, 0] : 0 }}
        transition={sequenceStep >= 1 ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : { duration: 1 }}
      />

      {/* 5. The Magnetic Motes Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-20 pointer-events-none" />

      {/* 6. Product Connection HUD Layers (with inverse parallax) */}
      <motion.div 
        className="absolute inset-0 z-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: sequenceStep >= 3 ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={disableAnim ? {} : { x: hudX, y: hudY }}
      >
        {/* Core Tracker (Near Robot) */}
        <div className="absolute top-[48%] left-[43%] w-16 h-16 border-[1px] border-[#D4A24C]/20 rounded-full flex items-center justify-center mix-blend-screen">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-[90%] h-[90%] border-t-[1px] border-r-[1px] border-[#D4A24C]/50 rounded-full"
          />
          <Activity className="absolute w-4 h-4 text-[#D4A24C]/60" />
        </div>

        {/* Right-Side Ticker & Divider (Fills Dead Space) */}
        <div className="absolute top-[20%] bottom-[20%] right-[10%] flex items-center">
          <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-[#D4A24C]/20 to-transparent" />
          <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 rotate-90 origin-center whitespace-nowrap">
            <motion.div 
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#D4A24C]/60"
              animate={{ x: [0, -50] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              [ STATUS: PREPARATION ACTIVE ] • [ ENVIRONMENT: STABLE ] • [ STATUS: PREPARATION ACTIVE ]
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 7. The Copy / Lower Third */}
      <div className="absolute z-40 pointer-events-none px-8 md:px-16 w-full max-w-[480px] bottom-[12%] md:bottom-[15%] left-0">
        
        {/* Dedicated Text Contrast Scrim */}
        <div className="absolute inset-0 scale-[1.5] -translate-x-8 translate-y-4" style={{ background: 'radial-gradient(ellipse at center left, rgba(5,3,2,0.85) 0%, rgba(5,3,2,0) 70%)' }} />
        
        {sequenceStep >= 4 && (
          <motion.div
            variants={disableAnim ? undefined : containerVariants}
            initial={disableAnim ? "visible" : "hidden"}
            animate="visible"
            className="relative z-10"
          >
            <motion.p 
              variants={itemVariants}
              className="font-sans text-[11px] md:text-[13px] text-[#D4A24C] uppercase tracking-[0.25em] font-medium mb-4" 
              style={{ textShadow: '0px 2px 10px rgba(0,0,0,0.9)' }}
            >
              Welcome to NotesHub
            </motion.p>

            <h1 className="font-serif text-[36px] md:text-[50px] leading-[1.05] font-medium text-[#FFF8D6] tracking-tight flex flex-col mb-6" style={{ textShadow: '0px 4px 40px rgba(0, 0, 0, 0.9), 0px 0px 40px rgba(212, 162, 76, 0.8)' }}>
              <motion.span variants={itemVariants} className="block text-[#FFF8D6]">Where preparation</motion.span>
              <motion.span variants={itemVariants} className="block text-white">becomes proof.</motion.span>
            </h1>

            {/* Signature Accent Line */}
            <motion.div 
              variants={lineDrawVariant}
              className="w-12 h-[2px] bg-[#D4A24C] origin-left rounded-full shadow-[0_0_8px_rgba(212,162,76,0.8)]"
            />
          </motion.div>
        )}
      </div>

    </motion.div>
  );
};
