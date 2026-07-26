import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BadgeCelebrationModalProps {
  badges: { id: string; name: string; description: string; icon: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeCelebrationModal: React.FC<BadgeCelebrationModalProps> = ({ badges, isOpen, onClose }) => {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  useEffect(() => {
    if (isOpen && badges && badges.length > 0) {
      triggerConfetti();
    }
  }, [isOpen, currentBadgeIndex, badges]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleNext = () => {
    if (currentBadgeIndex < badges.length - 1) {
      setCurrentBadgeIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  if (!badges || badges.length === 0) return null;

  const currentBadge = badges[currentBadgeIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center bg-gradient-to-br from-background to-primary/10 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex justify-center items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" /> 
            Badge Unlocked! 
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </DialogTitle>
        </DialogHeader>
        <div className="py-8 flex flex-col items-center justify-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-6xl shadow-inner border-4 border-primary/30 animate-bounce">
            {currentBadge.icon}
          </div>
          <h3 className="text-3xl font-black text-primary drop-shadow-sm">{currentBadge.name}</h3>
          <p className="text-muted-foreground max-w-xs">{currentBadge.description}</p>
          
          <div className="flex gap-1 pt-4 text-yellow-500">
             <Star className="h-5 w-5 fill-current" />
             <Star className="h-5 w-5 fill-current" />
             <Star className="h-5 w-5 fill-current" />
          </div>
        </div>
        <div className="flex justify-center pb-4">
          <Button onClick={handleNext} className="w-full max-w-xs font-bold text-lg h-12 rounded-xl">
            {currentBadgeIndex < badges.length - 1 ? "Next Badge" : "Awesome!"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
