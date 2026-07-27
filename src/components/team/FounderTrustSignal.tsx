import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreatorTrustProps {
  creatorId?: string;
  creatorName?: string;
  trust?: {
    teamsCreated?: number;
    teamsCompleted?: number;
    completionRate?: number | null;
    averageRatingReceived?: number;
    totalReviews?: number;
    isFirstTimeCreator?: boolean;
  };
  variant?: 'card' | 'detail';
}

export function FounderTrustSignal({
  creatorId,
  creatorName,
  trust,
  variant = 'card'
}: CreatorTrustProps) {
  if (!trust) return null;

  if (variant === 'card') {
    return (
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
        <span className="font-medium text-foreground truncate max-w-[110px]">
          {creatorName || 'Creator'}
        </span>
        <span className="text-muted-foreground/40">•</span>
        {trust.isFirstTimeCreator ? (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 font-normal bg-secondary/40 text-muted-foreground border-border/60 flex items-center gap-1 shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-blue-500" />
            First team hunt
          </Badge>
        ) : (
          <div className="flex items-center gap-1.5 truncate">
            <span className="flex items-center gap-1 font-medium text-foreground/90 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" />
              {trust.teamsCompleted || 0} {(trust.teamsCompleted === 1) ? 'team completed' : 'teams completed'}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-0.5 font-medium shrink-0">
              {trust.totalReviews && trust.totalReviews > 0 ? (
                <>
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline" />
                  <span className="text-foreground">{trust.averageRatingReceived}</span>
                  <span className="text-muted-foreground text-[10px]">({trust.totalReviews})</span>
                </>
              ) : (
                <span className="text-muted-foreground italic text-[11px]">No ratings yet</span>
              )}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Detail variant
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-sm">Founder Trust Signal</h4>
        </div>
        {creatorId && (
          <Link to={`/profile/${creatorId}`} className="text-xs text-primary hover:underline font-medium">
            View Profile & Reviews &rarr;
          </Link>
        )}
      </div>
      
      {trust.isFirstTimeCreator && (
        <div className="p-3 rounded-lg bg-secondary/40 border border-border/60 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-medium text-foreground">First Team Hunt</p>
            <p className="text-muted-foreground">
              This creator is leading their very first team on StudentHub. Every great leader starts with their first team!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="p-2.5 rounded-lg bg-secondary/20 border border-border/40">
          <div className="text-lg font-bold text-foreground">
            {trust.teamsCompleted || 0}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">/ {trust.teamsCreated || 0}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">Teams Completed</div>
        </div>
        
        <div className="p-2.5 rounded-lg bg-secondary/20 border border-border/40">
          <div className="text-lg font-bold text-foreground">
            {trust.completionRate !== null && trust.completionRate !== undefined ? `${Math.round(trust.completionRate * 100)}%` : (trust.teamsCreated && trust.teamsCreated > 0 ? `${Math.round(((trust.teamsCompleted || 0) / trust.teamsCreated) * 100)}%` : 'N/A')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">Completion Rate</div>
        </div>
        
        <div className="p-2.5 rounded-lg bg-secondary/20 border border-border/40">
          <div className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
            {trust.totalReviews && trust.totalReviews > 0 ? (
              <>
                <span>{trust.averageRatingReceived}</span>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </>
            ) : (
              <span className="text-xs font-normal text-muted-foreground italic">No ratings</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
            {trust.totalReviews && trust.totalReviews > 0 ? `${trust.totalReviews} review${trust.totalReviews !== 1 ? 's' : ''}` : 'No ratings yet'}
          </div>
        </div>
      </div>
    </div>
  );
}
