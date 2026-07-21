import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Activity, Hash, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

export const AdminFeedMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/stats/feed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        toast.error("Failed to load feed metrics");
      }
    } catch (e) {
      toast.error("Network error loading metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!metrics) return <div>No data available.</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" /> Feed Metrics
      </h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" /> Flagged Content Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.flaggedRate?.toFixed(2) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Posts pending review vs total posts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Posts Per Day (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.postsPerDay?.length > 0 ? (
              <div className="space-y-2">
                {metrics.postsPerDay.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between p-2 border rounded">
                    <span>{p._id}</span>
                    <span className="font-semibold">{p.count} posts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No data available for the last 7 days.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5" /> Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topTags?.length > 0 ? (
              <div className="space-y-2">
                {metrics.topTags.map((t: any, index: number) => (
                  <div key={t._id} className="flex items-center justify-between p-2 border rounded bg-secondary/10">
                    <span className="font-medium">#{t._id}</span>
                    <span className="text-muted-foreground text-sm">{t.count} uses</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tags available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
