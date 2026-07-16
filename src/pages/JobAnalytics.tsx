import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

const JobAnalytics: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/jobs/${id}/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to fetch analytics');
        }
        const analyticsData = await res.json();
        setData(analyticsData);
      } catch (err: any) {
        toast.error(err.message);
        navigate(`/recruiter/jobs/${id}/applicants`);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id, navigate]);

  if (loading) {
    return <div className="container mx-auto p-8 animate-pulse"><div className="h-40 bg-gray-200 rounded-lg"></div></div>;
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/recruiter/jobs/${id}/applicants`)} className="text-gray-500 -ml-4">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to ATS
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Job Analytics</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.applicantCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.conversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Applicants per view</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {data.applicationsOverTime && data.applicationsOverTime.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.applicationsOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusBreakdown && data.statusBreakdown.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {data.statusBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend className="capitalize" formatter={(value) => value.replace('_', ' ')} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobAnalytics;
