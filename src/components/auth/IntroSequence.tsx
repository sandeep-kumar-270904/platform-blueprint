import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroSequenceProps {
  state: 'typing' | 'opening';
  onStartOpening: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ state, onStartOpening, onComplete, onSkip }) => {
  const [showSkip, setShowSkip] = useState(false);
  const text = "Every page you turn is progress.";
  const letters = Array.from(text);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-none" style={{ perspective: "2000px" }}>
      {/* Left Cover (Stays static as background until flip completes) */}
      <motion.div 
        className="absolute inset-y-0 left-0 w-1/2 bg-[#2C1A14] pointer-events-auto z-40" 
        initial={{ opacity: 1 }}
        animate={{ opacity: state === 'opening' ? 0 : 1 }}
        transition={{ duration: 0.1, delay: 1.1 }} // Fades out right before completion
      />

      {/* Right Cover (Flips to the left) */}
      <motion.div 
        className="absolute inset-y-0 right-0 w-1/2 bg-[#2C1A14] pointer-events-auto origin-left z-50 border-l border-[#4A2B20]/30"
        initial={{ rotateY: 0 }}
        animate={state === 'opening' ? { rotateY: -180 } : { rotateY: 0 }}
        transition={{ duration: 1.2, ease: [0.4, 0.0, 0.2, 1] }}
        onAnimationComplete={() => {
          if (state === 'opening') {
            onComplete();
          }
        }}
        style={{ backfaceVisibility: 'hidden', boxShadow: state === 'opening' ? '-20px 0 50px rgba(0,0,0,0.5)' : 'none' }}
      />
      
      {/* Right Cover Backface/Underlay (Fades out during flip) */}
      <motion.div 
        className="absolute inset-y-0 right-0 w-1/2 bg-[#2C1A14] pointer-events-none origin-left z-40"
        initial={{ rotateY: 0, opacity: 1 }}
        animate={state === 'opening' ? { rotateY: -180, opacity: 0 } : { rotateY: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.4, 0.0, 0.2, 1] }}
      />

      {/* Skip button */}
      <AnimatePresence>
        {state === 'typing' && showSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
            className="absolute bottom-8 right-8 text-zinc-500 hover:text-zinc-300 font-medium tracking-wide pointer-events-auto z-50"
          >
            Skip intro &rarr;
          </motion.button>
        )}
      </AnimatePresence>

      {/* Centered Text */}
      <AnimatePresence>
        {state === 'typing' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.h1 
              layoutId="headline-text"
              className="text-4xl md:text-5xl font-serif text-zinc-100 tracking-tight flex items-center"
            >
              {letters.map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.01, delay: i * 0.04 + Math.random() * 0.02 }}
                  onAnimationComplete={() => {
                    if (i === letters.length - 1) {
                      setTimeout(() => onStartOpening(), 500);
                    }
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
              <motion.div 
                className="w-[2px] h-[1em] foil-stamp ml-1"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            </motion.h1>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
