import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, BarChart3, Users, Eye, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      try {
        const [overviewRes, jobsRes] = await Promise.all([
          fetch(`${API_URL}/api/recruiter/analytics/overview`, { headers: { 'Authorization': `Bearer ${token}` } }),
          // We can fetch jobs from the existing endpoint or just a specific recruiter one. 
          // For now, let's assume we can fetch recruiter jobs by querying the recruiter's id, or we just rely on ATS overview.
          // Wait, actually we can just fetch /api/jobs and the backend will need to be queried for our jobs.
          // The API doesn't have a direct /api/recruiter/jobs endpoint yet in Phase 1, but we can query /api/jobs?postedBy=me or similar.
          // Actually, let's just make a quick call if we don't have it, or just show the overview stats.
          // Let's add /api/recruiter/jobs endpoint to recruiter.js quickly if we need, or just use the stats.
          fetch(`${API_URL}/api/recruiter/analytics/overview`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setOverview(data);
        }

        // To get the list of jobs, we might need a dedicated endpoint or we just show the stats.
        // Let's fetch jobs by getting all jobs and filtering? No, the overview endpoint can just return the jobs array too.
        // Since we didn't add it to overview, we will just show the stats.
      } catch (err) {
        console.error(err);
        toast.error("Failed to load recruiter analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return <div className="container mx-auto p-8 animate-pulse"><div className="h-40 bg-gray-200 rounded-lg"></div></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Recruiter Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of your job postings and applicant engagement.</p>
        </div>
        <Button onClick={() => navigate('/jobs')}>
          <Briefcase className="w-4 h-4 mr-2" /> View Job Board
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalJobs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalViews || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalApplicants || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((overview?.averageConversionRate || 0) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Job</CardTitle>
        </CardHeader>
        <CardContent>
          {overview?.bestPerformingJob ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <h3 className="font-semibold text-lg">{overview.bestPerformingJob.title}</h3>
                <p className="text-sm text-gray-500">Conversion Rate: {(overview.bestPerformingJob.conversionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate(`/recruiter/jobs/${overview.bestPerformingJob.id}/applicants`)}>
                  Applicants
                </Button>
                <Button onClick={() => navigate(`/recruiter/jobs/${overview.bestPerformingJob.id}/analytics`)}>
                  Analytics <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Not enough data to determine top performing job.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruiterDashboard;
