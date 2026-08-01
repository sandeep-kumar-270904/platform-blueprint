import React from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type VerificationStatus = 'none' | 'email_verified' | 'id_verified';

interface RoommateVerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
  iconSize?: number;
}

export const RoommateVerificationBadge: React.FC<RoommateVerificationBadgeProps> = ({ 
  status, 
  className = "",
  iconSize = 16 
}) => {
  if (!status || status === 'none') return null;

  if (status === 'id_verified') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ShieldCheck 
              className={`text-amber-500 fill-amber-50 dark:fill-amber-950/30 inline-block ${className}`} 
              size={iconSize} 
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold text-xs">ID Verified</p>
            <p className="text-[10px] text-muted-foreground">Student ID manually reviewed</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'email_verified') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle 
              className={`text-blue-500 fill-blue-50 dark:fill-blue-950/30 inline-block ${className}`} 
              size={iconSize} 
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold text-xs">Email Verified</p>
            <p className="text-[10px] text-muted-foreground">College email confirmed</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};
