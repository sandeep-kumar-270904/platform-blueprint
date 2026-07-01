import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, Users, Star, Clock, TrendingUp } from "lucide-react";

export const HostAnalytics = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: hostedClasses } = await supabase
        .from("virtual_classrooms")
        .select("id, participant_count, created_at")
        .eq("host_id", userId);

      if (!hostedClasses || hostedClasses.length === 0) {
        setStats({ totalSessions: 0 });
        setLoading(false);
        return;
      }

      const classIds = hostedClasses.map(c => c.id);

      const [logsRes, feedbackRes, transRes] = await Promise.all([
        supabase.from("virtual_classroom_attendance_log").select("*").in("classroom_id", classIds),
        supabase.from("virtual_classroom_feedback").select("rating").in("classroom_id", classIds),
        supabase.from("virtual_classroom_transactions").select("amount, status, type").in("classroom_id", classIds)
      ]);

      const logs = logsRes.data || [];
      const feedbacks = feedbackRes.data || [];
      const transactions = transRes.data || [];
      
      const uniqueAttendees = new Set(logs.map(l => l.user_id)).size;
      const totalRatings = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      const avgRating = feedbacks.length > 0 ? (totalRatings / feedbacks.length).toFixed(1) : 0;
      
      let totalMinutes = 0;
      logs.forEach(l => {
        if (l.left_at && l.joined_at) {
          const diff = new Date(l.left_at).getTime() - new Date(l.joined_at).getTime();
          totalMinutes += diff / (1000 * 60);
        }
      });
      
      const avgDuration = uniqueAttendees > 0 ? Math.round(totalMinutes / uniqueAttendees) : 0;
      
      const totalEarnings = transactions
        .filter(t => t.type === 'payment' && t.status === 'completed')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      setStats({
        totalSessions: hostedClasses.length,
        totalAttendees: uniqueAttendees,
        avgRating,
        avgDuration,
        totalEarnings
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [userId]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading analytics...</div>;
  }

  if (stats.totalSessions === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">No Hosting Data Yet</h3>
          <p className="text-muted-foreground text-sm">Host a virtual classroom session to start collecting analytics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-primary" /> Hosting Performance Overview
        </h2>
        <p className="text-sm text-muted-foreground">Aggregate statistics across all your hosted sessions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <BarChart2 className="h-6 w-6 text-primary mb-2" />
            <p className="text-3xl font-bold">{stats.totalSessions}</p>
            <p className="text-sm text-muted-foreground font-medium">Sessions Hosted</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{stats.totalAttendees}</p>
            <p className="text-sm text-muted-foreground font-medium">Total Attendees Reached</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Star className="h-6 w-6 text-yellow-500 mb-2" />
            <p className="text-3xl font-bold flex items-end gap-1">
              {stats.avgRating} <span className="text-sm text-muted-foreground font-normal mb-1">/ 5.0</span>
            </p>
            <p className="text-sm text-muted-foreground font-medium">Average Rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Clock className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-3xl font-bold flex items-end gap-1">
              {stats.avgDuration} <span className="text-sm text-muted-foreground font-normal mb-1">min</span>
            </p>
            <p className="text-sm text-muted-foreground font-medium">Avg Watch Time</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="text-green-600 mb-2 font-bold text-2xl">$</div>
            <p className="text-3xl font-bold flex items-end gap-1">
              {stats.totalEarnings}
            </p>
            <p className="text-sm text-green-600/80 font-medium">Total Earnings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
