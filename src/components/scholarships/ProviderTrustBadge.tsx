import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProviderTrustBadgeProps {
  status: string;
}

export const ProviderTrustBadge: React.FC<ProviderTrustBadgeProps> = ({ status }) => {
  if (!status) return null;

  switch (status) {
    case 'admin_added':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400">
          <Shield className="w-3 h-3 mr-1" />
          Verified: Admin Added
        </Badge>
      );
    case 'verified_org':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Verified Organization
        </Badge>
      );
    case 'verified_institution':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
          <Building2 className="w-3 h-3 mr-1" />
          Verified Institution
        </Badge>
      );
    case 'unverified_submission':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Unverified Submission
        </Badge>
      );
    default:
      return null;
  }
};
