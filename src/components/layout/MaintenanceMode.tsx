import React from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MaintenanceModeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useSiteContent();
  const { user } = useAuth();

  if (isLoading) return <>{children}</>;

  const isMaintenance = data?.settings?.maintenanceMode;
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (isMaintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <ShieldAlert className="h-24 w-24 text-amber-500 mb-6" />
        <h1 className="text-4xl font-bold tracking-tight mb-4">Under Maintenance</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto mb-8">
          We are currently performing scheduled maintenance on the platform. Please check back later!
        </p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  // If admin, maybe show a small toast or banner indicating they bypass maintenance mode
  return (
    <>
      {isMaintenance && isAdmin && (
        <div className="bg-amber-500 text-black text-xs text-center py-1 font-bold">
          MAINTENANCE MODE IS ACTIVE (You bypass this as an Admin)
        </div>
      )}
      {children}
    </>
  );
};
