import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useSocket } from '../../hooks/useSocket';

export default function AdminCareerOpportunities() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consistencyIssues, setConsistencyIssues] = useState<any>(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('admin:overviewChanged', fetchData);
    }
    return () => {
      if (socket) socket.off('admin:overviewChanged', fetchData);
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/career-opportunities/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setData(data);
    } catch (err) {
      console.error('Failed to fetch overview data', err);
    } finally {
      setLoading(false);
    }
  };

  const runConsistencyCheck = async () => {
    setRunningCheck(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/career-opportunities/consistency-check', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to check');
      const data = await res.json();
      setConsistencyIssues(data);
    } catch (err) {
      console.error('Failed consistency check', err);
    } finally {
      setRunningCheck(false);
    }
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-red-500">Failed to load dashboard.</div>;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Career Opportunities Sync</h1>
          <p className="text-gray-500 mt-1">Unified view of all jobs, applications, and recruiter activities.</p>
        </div>
        <Button onClick={runConsistencyCheck} disabled={runningCheck}>
          {runningCheck ? 'Running Check...' : 'Run Consistency Check'}
        </Button>
      </div>

      {consistencyIssues && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Consistency Check Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-red-800">Orphaned Applications ({consistencyIssues.orphanedApplications.length})</h3>
              <ul className="list-disc pl-5 text-sm text-red-600">
                {consistencyIssues.orphanedApplications.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Applicant Count Mismatches ({consistencyIssues.applicantCountMismatches.length})</h3>
              <ul className="list-disc pl-5 text-sm text-red-600">
                {consistencyIssues.applicantCountMismatches.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Alerts for Banned Users ({consistencyIssues.alertsForBannedUsers.length})</h3>
              <ul className="list-disc pl-5 text-sm text-red-600">
                {consistencyIssues.alertsForBannedUsers.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Silent Email Failures ({consistencyIssues.silentEmailFailures.length})</h3>
              <ul className="list-disc pl-5 text-sm text-red-600">
                {consistencyIssues.silentEmailFailures.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Jobs Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Jobs (Past 7d: {data.jobs.recent})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.jobs.published} Active</div>
            <div className="text-sm text-gray-500 mt-2 flex gap-4">
              <span>{data.jobs.draft} Draft</span>
              <span>{data.jobs.closed} Closed</span>
            </div>
          </CardContent>
        </Card>

        {/* Applications Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Applications (Past 7d: {data.applications.recent})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.applications.total} Total</div>
            <div className="text-sm text-gray-500 mt-2 flex gap-4">
              <span>{data.applications.status.applied || 0} Applied</span>
              <span>{data.applications.status.interviewing || 0} Interview</span>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex justify-between">
              Moderation
              {(data.moderation.pendingReports > 0 || data.jobs.underReview > 0 || data.moderation.pendingVerifications > 0) && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{data.moderation.pendingReports + data.jobs.underReview} Action Required</div>
            <div className="text-sm text-gray-500 mt-2 flex gap-4 flex-wrap">
              <span>{data.jobs.underReview} Jobs Auto-Hidden</span>
              <span>{data.moderation.pendingVerifications} Pending Verification</span>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Candidate Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data.engagement.jobAlerts} Active Alerts</div>
            <div className="text-sm text-gray-500 mt-2 flex gap-4 flex-wrap">
              <span>{data.engagement.savedJobs} Saved Jobs</span>
              <span>{data.visibility.totalProfileViews} Profile Views</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.activityFeed.map((item: any, i: number) => (
                <div key={i} className="flex flex-col border-l-2 pl-3 border-gray-200">
                  <span className="text-sm font-medium text-gray-900">{item.action}</span>
                  <span className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</span>
                </div>
              ))}
              {data.activityFeed.length === 0 && <p className="text-sm text-gray-500">No recent activity.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Notifications & System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notification Delivery (7d)</h3>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-bold text-xl">{data.notifications.totalSent}</div>
                  <div className="text-xs text-gray-500">Total Created</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-red-600">{data.notifications.failedEmails}</div>
                  <div className="text-xs text-red-500">Email Failures</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Campus Insights</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-gray-700">Top Skills: </span>
                  {data.insights.topSkills.map((s: any) => `${s._id} (${s.count})`).join(', ')}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-700">Top Companies: </span>
                  {data.insights.topCompanies.map((c: any) => `${c._id} (${c.jobCount})`).join(', ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
