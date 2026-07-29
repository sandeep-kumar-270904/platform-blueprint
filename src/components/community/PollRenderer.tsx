import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PollRendererProps {
  poll: {
    options: { text: string; votes: number }[];
  };
  userVotedIndex?: number | null;
  onVote: (optionIndex: number) => Promise<void>;
}

export const PollRenderer = ({ poll, userVotedIndex, onVote }: PollRendererProps) => {
  const [votingIndex, setVotingIndex] = React.useState<number | null>(null);

  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  const handleVote = async (idx: number) => {
    if (userVotedIndex != null) return;
    setVotingIndex(idx);
    try {
      await onVote(idx);
    } finally {
      setVotingIndex(null);
    }
  };

  return (
    <div className="my-3 space-y-2 border rounded-lg p-4 bg-secondary/10">
      {poll.options.map((opt, idx) => {
        const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
        const isVoted = userVotedIndex === idx;

        return (
          <div key={idx} className="relative group">
            {userVotedIndex != null ? (
              <div className="relative w-full overflow-hidden rounded-md bg-secondary/30 h-10 flex items-center px-3 border border-transparent">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${isVoted ? 'bg-primary/20' : 'bg-secondary'}`} 
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative z-10 flex justify-between w-full text-sm">
                  <span className={`font-medium ${isVoted ? 'text-primary' : ''}`}>
                    {opt.text}
                    {isVoted && <span className="ml-2 text-xs opacity-80">(You)</span>}
                  </span>
                  <span className="font-semibold text-muted-foreground">{percentage}%</span>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto min-h-[40px] text-left hover:border-primary/50 whitespace-normal"
                onClick={() => handleVote(idx)}
                disabled={votingIndex !== null}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span>{opt.text}</span>
                  {votingIndex === idx && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </Button>
            )}
          </div>
        );
      })}
      <div className="text-xs text-muted-foreground text-right mt-2">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
