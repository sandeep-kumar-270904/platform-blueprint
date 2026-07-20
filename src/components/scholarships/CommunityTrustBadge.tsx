import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const CommunityTrustBadge: React.FC<{ scholarshipId: string }> = ({ scholarshipId }) => {
  const [data, setData] = useState<{ trustLevel: string; reviewCount: number; averageRating: number; confirmedAwardeeCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrust = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/community-trust`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load community trust data", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (scholarshipId) {
      fetchTrust();
    }
  }, [scholarshipId]);

  if (loading) return <div className="inline-flex"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  let Icon = Shield;
  let colorClass = 'text-gray-500 bg-gray-100 border-gray-200';
  let label = 'Emerging';

  if (data.trustLevel === 'well_reviewed' || data.trustLevel === 'Well-Reviewed') {
    Icon = ShieldCheck;
    colorClass = 'text-green-600 bg-green-50 border-green-200';
    label = 'Well-Reviewed';
  } else if (data.trustLevel === 'established' || data.trustLevel === 'Established') {
    Icon = Shield;
    colorClass = 'text-purple-600 bg-purple-50 border-purple-200';
    label = 'Established';
  } else {
    Icon = ShieldAlert;
    colorClass = 'text-orange-500 bg-orange-50 border-orange-200';
    label = 'Emerging';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border cursor-help ${colorClass}`}>
            <Icon className="w-3.5 h-3.5 mr-1" />
            <span>Community-Proven: {label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p className="font-semibold mb-1">Community Trust Signal</p>
          <p className="text-xs mb-2">Based on {data.reviewCount} reviews (Avg {data.averageRating.toFixed(1)}/5) and {data.confirmedAwardeeCount} confirmed awardees.</p>
          <p className="text-xs text-muted-foreground italic">Note: Distinct from "Platform-Verified", which indicates verification of the submitter.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
