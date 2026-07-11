import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface BookTransitionProps {
  status: 'idle' | 'success_signin' | 'success_signup';
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const BookTransition: React.FC<BookTransitionProps> = ({ status, leftPanel, rightPanel }) => {
  const shouldReduceMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setIsAnimating(true);
    }
  }, [status]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950" style={{ perspective: "2000px" }}>
      {/* Background layer revealing underneath */}
      <motion.div 
        className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[#FDFBF7]"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ 
          opacity: status !== 'idle' ? 1 : 0,
          scale: status !== 'idle' ? 1 : 0.98 
        }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        {/* Minimal dashboard/onboarding skeleton hint */}
        <div className="w-full max-w-5xl h-full border-x border-zinc-200 bg-[#FDFBF7] shadow-sm opacity-50" />
      </motion.div>

      {/* The Book Covers */}
      <div className="min-h-screen flex flex-col-reverse md:flex-row relative z-10" style={{ transformStyle: "preserve-3d" }}>
        <motion.div 
          className="w-full md:w-[55%] origin-left"
          animate={status !== 'idle' ? { 
            rotateY: -90, 
            opacity: [1, 1, 0],
          } : { rotateY: 0, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.2, 0.8, 0.2, 1], // Custom ease-out with very subtle settle
          }}
          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
        >
          {leftPanel}
        </motion.div>

        <motion.div 
          className="w-full md:w-[45%] origin-right"
          animate={status !== 'idle' ? { 
            rotateY: 90, 
            opacity: [1, 1, 0],
          } : { rotateY: 0, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.2, 0.8, 0.2, 1], 
          }}
          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
        >
          {rightPanel}
        </motion.div>
      </div>
    </div>
  );
};
