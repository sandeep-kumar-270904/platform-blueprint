import React, { useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Download, Trophy, Clock } from "lucide-react";
import { toast } from "sonner";

interface ShareResultCardProps {
  quizTitle: string;
  score: number;
  totalScore: number;
  timeTakenStr: string;
  username: string;
}

export function ShareResultCard({ quizTitle, score, totalScore, timeTakenStr, username }: ShareResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const percentage = Math.round((score / totalScore) * 100);

  const handleShare = async () => {
    // In a real app we'd use html2canvas to turn the ref into an image, then Web Share API
    // For this prototype, we'll simulate sharing text.
    const text = `I just scored ${percentage}% on "${quizTitle}" at StudentHub in ${timeTakenStr}! Can you beat my score?`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My StudentHub Quiz Result',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(text + " " + window.location.href);
      toast.success("Result copied to clipboard!");
    }
  };

  return (
    <div className="space-y-4">
      <div ref={cardRef} className="p-6 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl text-white shadow-xl max-w-sm mx-auto">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-yellow-300 drop-shadow-md" />
          <div>
            <h3 className="text-2xl font-black">{percentage}%</h3>
            <p className="text-sm font-medium opacity-90">{score} / {totalScore} Points</p>
          </div>
          <div>
            <p className="text-lg font-bold">{quizTitle}</p>
            <p className="text-sm opacity-80">Completed by @{username}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm bg-black/20 py-2 rounded-full">
            <Clock className="w-4 h-4" /> {timeTakenStr}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <Button onClick={handleShare} className="w-full max-w-sm">
          <Share2 className="w-4 h-4 mr-2" /> Share Result
        </Button>
      </div>
    </div>
  );
}
