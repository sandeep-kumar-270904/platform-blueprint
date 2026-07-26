import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminAnalyticsHub = () => {
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [gRes, eRes, rRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/analytics/growth?days=${days}`, { headers }),
        fetch(`${API_URL}/api/admin/analytics/engagement?days=${days}`, { headers }),
        fetch(`${API_URL}/api/admin/analytics/reports`, { headers })
      ]);

      if (gRes.ok) setGrowthData(await gRes.json());
      if (eRes.ok) setEngagementData(await eRes.json());
      if (rRes.ok) setReportData(await rRes.json());
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground animate-pulse">Loading Analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-muted-foreground">Monitor real-time platform health and growth.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <Button variant={days === 7 ? 'default' : 'ghost'} size="sm" onClick={() => setDays(7)}>7 Days</Button>
          <Button variant={days === 30 ? 'default' : 'ghost'} size="sm" onClick={() => setDays(30)}>30 Days</Button>
          <Button variant={days === 90 ? 'default' : 'ghost'} size="sm" onClick={() => setDays(90)}>90 Days</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>User Growth (Signups)</CardTitle>
            <CardDescription>Daily new user registrations over the last {days} days.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="users" name="New Users" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>Module Engagement</CardTitle>
            <CardDescription>Daily activity across major platform modules.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="quizzes" stackId="a" fill="#8b5cf6" name="Quizzes Taken" radius={[0, 0, 0, 0]} />
                <Bar dataKey="jobs" stackId="a" fill="#f59e0b" name="Jobs Applied" radius={[0, 0, 0, 0]} />
                <Bar dataKey="mentorships" stackId="a" fill="#10b981" name="Mentor Bookings" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>Content Health (Reports)</CardTitle>
          <CardDescription>Pending vs Resolved reports by module.</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              <Bar dataKey="pending" fill="#ef4444" name="Pending Review" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#22c55e" name="Resolved/Clean" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
