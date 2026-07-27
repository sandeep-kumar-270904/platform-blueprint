import React from 'react';
import { useCreatorAnalytics } from '../../hooks/useCreators';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, TrendingUp, Users, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const CreatorAnalytics: React.FC = () => {
  const { data: analytics, isLoading, error } = useCreatorAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Failed to load analytics data.</p>
        </CardContent>
      </Card>
    );
  }

  if (analytics.totals.views === 0 && analytics.totals.likes === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          You haven't received any views or engagement yet. Keep creating and sharing your content!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* High-level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Views</p>
              <h4 className="text-2xl font-bold">{analytics.totals.views.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Likes</p>
              <h4 className="text-2xl font-bold">{analytics.totals.likes.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Comments</p>
              <h4 className="text-2xl font-bold">{analytics.totals.comments.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engagement Trend (30 Days)</CardTitle>
            <CardDescription>Your views and likes over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeseries} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d')} 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line type="monotone" name="Views" dataKey="views" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Likes" dataKey="likes" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Audience Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Breakdown</CardTitle>
            <CardDescription>Performance by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {analytics.audienceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.audienceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.audienceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number) => [value.toLocaleString(), 'Views']}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Not enough data for breakdown
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
          <CardDescription>Your best pieces by overall engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerforming.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="font-bold text-lg text-muted-foreground w-6 text-center">
                    #{index + 1}
                  </div>
                  <div className="truncate">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground uppercase">{item.type}</p>
                  </div>
                </div>
                <div className="flex space-x-6 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="font-semibold">{item.views.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3"/> Views</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold">{item.likes.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><ThumbsUp className="w-3 h-3"/> Likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
