import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, ChevronRight, UserPlus, Home, UserCheck } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

export const RoommatesDashboardWidget = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/roommate-summary`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();

    if (!socket) return;

    const handleNotification = (notification: any) => {
      if (notification?.type?.startsWith('roommate_connection_')) {
        fetchSummary(); // Refresh stats silently in the background
      }
    };

    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [socket]);

  if (loading) {
    return (
      <Card className="h-full border-border bg-card animate-pulse">
        <CardContent className="p-6 h-48 flex items-center justify-center text-muted-foreground">
          Loading Roommate Finder...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-border bg-card border-dashed">
        <CardContent className="p-6 h-48 flex flex-col items-center justify-center text-muted-foreground">
          <Users className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Roommate Data Temporarily Unavailable</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.status === 'no_profile') {
    return (
      <Card className="h-full border-border bg-card overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Home className="w-24 h-24 text-primary" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Roommate Finder
          </CardTitle>
          <CardDescription>Find your perfect flatmate.</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
          <p className="text-sm text-muted-foreground">
            Looking for a roommate? Create a profile to start matching with like-minded peers based on compatibility.
          </p>
          <Button asChild className="w-full justify-between">
            <Link to="/roommate-finder?action=profile">
              Create Profile <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border bg-card flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Roommate Finder
            </CardTitle>
            <CardDescription>Your roommate search activity</CardDescription>
          </div>
          {(data.status === 'paused' || data.status === 'hidden') && (
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">
              Hidden
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Completeness Score */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground font-medium">Profile Completeness</span>
              <span className="font-bold text-primary">{data.completenessScore}%</span>
            </div>
            <Progress value={data.completenessScore} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Link 
              to="/roommate-finder?tab=connections" 
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 mb-2">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold">{data.pendingRequests}</div>
              <div className="text-xs text-muted-foreground font-medium text-center mt-1">Pending</div>
            </Link>
            
            <Link 
              to="/roommate-finder?tab=connections" 
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 mb-2">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold">{data.activeConnections}</div>
              <div className="text-xs text-muted-foreground font-medium text-center mt-1">Connected</div>
            </Link>
          </div>

          {(data.status === 'paused' || data.status === 'hidden') && (
             <p className="text-xs text-orange-500 font-medium">
               Your profile is hidden. Unpause it to get matched.
             </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button asChild variant="outline" className="w-full justify-between group">
            <Link to="/roommate-finder">
              Find Roommates
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
