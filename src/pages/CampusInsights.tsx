import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Briefcase, Building2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CampusInsights: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/insights/campus-hiring`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to fetch insights');
        }
        const insightsData = await res.json();
        setData(insightsData);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [navigate]);

  if (loading) {
    return <div className="container mx-auto p-8 animate-pulse"><div className="h-40 bg-gray-200 rounded-lg"></div></div>;
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/jobs')} className="text-gray-500 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Campus Hiring Insights</h1>
            <p className="text-gray-500">Real-time data on hiring trends, top skills, and companies.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Applications / Job</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.avgApplications.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">Competition level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Skill Demand</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {data.topSkills.length > 0 ? data.topSkills[0]._id : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Most requested skill</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Hiring Company</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {data.topCompanies.length > 0 ? data.topCompanies[0]._id : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Most active recruiter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hiring Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.trendData && data.trendData.length > 0 ? data.trendData[data.trendData.length - 1].count : 0} Jobs
            </div>
            <p className="text-xs text-gray-500 mt-1">Posted this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>In-Demand Skills</CardTitle>
            <CardDescription>Most frequently required skills in recent job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSkills} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hiring Volume Trend</CardTitle>
            <CardDescription>Number of jobs posted over the last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="_id" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(val) => `Week ${val}`} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => `Week of Year: ${label}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Hiring Companies</CardTitle>
          <CardDescription>Companies with the most active job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mt-4">
            {data.topCompanies.map((company: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[200px]">
                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-semibold">{company._id}</h4>
                  <p className="text-sm text-gray-500">{company.count} active jobs</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampusInsights;
