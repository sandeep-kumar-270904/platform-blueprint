import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSecondChanceMatches } from '@/hooks/useTeams';

interface SecondChanceBannerProps {
  teamId: string;
}

export const SecondChanceBanner: React.FC<SecondChanceBannerProps> = ({ teamId }) => {
  const [dismissed, setDismissed] = useState(false);
  const { data: matches, isLoading, isError } = useSecondChanceMatches(teamId, !dismissed && !!teamId);

  if (dismissed || isLoading || isError || !matches || matches.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-emerald-500/10 via-background to-teal-500/10 rounded-xl border border-emerald-500/20 shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-4 w-4 text-emerald-500 shrink-0 animate-pulse" />
          <span>{matches.length} other {matches.length === 1 ? 'team is' : 'teams are'} looking for someone like you:</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[10px] h-6 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {matches.map((m: any) => (
          <Link
            key={m.teamId}
            to={`/team-hunt/${m.teamId}`}
            className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors text-xs group"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{m.title}</span>
              {m.description && <span className="text-[10px] text-muted-foreground truncate">{m.description}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                {m.matchScore}% Match
              </Badge>
              <ArrowRight className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
