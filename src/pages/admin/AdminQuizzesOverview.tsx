import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import socketService from '../../services/socketService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, BarChart3, Users, MailWarning, Award, BrainCircuit, Flag, RefreshCw } from 'lucide-react';

interface QuizzesOverviewData {
  quizzes: {
    published: number;
    draft: number;
    closed: number;
    underReview: number;
    recent: number;
    solo: number;
    live: number;
  };
  attempts: {
    total: number;
    completed: number;
    abandoned: number;
    recent: number;
  };
  liveSessions: {
    scheduled: number;
    inProgress: number;
    recentCompleted: number;
    avgParticipants: number;
  };
  moderation: {
    pendingReports: number;
    underReview: number;
  };
  notifications: {
    recentActivity: number;
    emailFailures: number;
  };
  engagement: {
    activeStreaks: number;
    totalBadges: number;
    totalSubscriptions: number;
  };
  topContent: {
    mostAttempted: Array<{ _id: string; title: string; attemptCount: number; mode: string }>;
    highestRated: Array<{ _id: string; title: string; averageScore: number; attemptCount: number; mode: string }>;
  };
}

const AdminQuizzesOverview: React.FC = () => {
  const [data, setData] = useState<QuizzesOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/quizzes-overview');
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quizzes overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = socketService.connect();
    
    const handleUpdate = () => {
      fetchData(); // Silently refresh data
    };

    socket.on('admin:quizOverviewChanged', handleUpdate);

    return () => {
      socket.off('admin:quizOverviewChanged', handleUpdate);
    };
  }, []);

  if (loading && !data) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quizzes Command Center</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Comprehensive analytics across Phase 1-4 quiz modules.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/quiz-reports"
            className="flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Flag className="w-4 h-4 mr-2" />
            Moderation Queue
            {data.moderation.pendingReports > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                {data.moderation.pendingReports}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Quizzes Stats */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Quizzes</CardTitle>
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.quizzes.published + data.quizzes.draft + data.quizzes.closed}</div>
            <p className="text-xs text-gray-500 mt-1">{data.quizzes.recent} added in last 7 days</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{data.quizzes.published} Published</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{data.quizzes.live} Live</Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{data.quizzes.solo} Solo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Attempts Stats */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Attempts</CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.attempts.total}</div>
            <p className="text-xs text-gray-500 mt-1">{data.attempts.recent} in last 7 days</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-green-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> {data.attempts.completed} completed</span>
              <span className="text-gray-500">{data.attempts.abandoned} abandoned</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${data.attempts.total > 0 ? (data.attempts.completed / data.attempts.total) * 100 : 0}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Live Sessions Stats */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Live Sessions</CardTitle>
            <Users className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.liveSessions.inProgress} Active</div>
            <p className="text-xs text-gray-500 mt-1">{data.liveSessions.recentCompleted} completed in last 7 days</p>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Scheduled:</span>
                <span className="font-medium text-gray-900">{data.liveSessions.scheduled}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Participants:</span>
                <span className="font-medium text-gray-900">{data.liveSessions.avgParticipants}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Stats */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Engagement</CardTitle>
            <Award className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.engagement.activeStreaks}</div>
            <p className="text-xs text-gray-500 mt-1">Users with active streaks</p>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Badges Awarded:</span>
                <span className="font-medium text-gray-900">{data.engagement.totalBadges}</span>
              </div>
              <div className="flex justify-between">
                <span>Quiz Subscriptions:</span>
                <span className="font-medium text-gray-900">{data.engagement.totalSubscriptions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Top Attempted Quizzes */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Most Popular Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Title</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topContent.mostAttempted.map((quiz, i) => (
                    <tr key={quiz._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link to={`/analytics/${quiz._id}`} className="hover:text-indigo-600 hover:underline">{quiz.title}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize text-xs">{quiz.mode}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{quiz.attemptCount}</td>
                    </tr>
                  ))}
                  {data.topContent.mostAttempted.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No content data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Health / Moderation */}
        <div className="space-y-6">
          <Card className={`border ${data.moderation.pendingReports > 0 ? 'border-amber-200 shadow-sm' : 'border-gray-200 shadow-sm'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                Moderation Health
                {data.moderation.pendingReports > 0 && <AlertCircle className="w-4 h-4 ml-2 text-amber-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Pending Reports</span>
                  <span className={`text-lg font-bold ${data.moderation.pendingReports > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {data.moderation.pendingReports}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Quizzes Under Review</span>
                  <span className={`text-lg font-bold ${data.moderation.underReview > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {data.moderation.underReview}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border ${data.notifications.emailFailures > 0 ? 'border-red-200 shadow-sm' : 'border-gray-200 shadow-sm'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                System Health
                {data.notifications.emailFailures > 0 && <MailWarning className="w-4 h-4 ml-2 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Recent Notifications</span>
                  <span className="text-lg font-bold text-gray-900">{data.notifications.recentActivity}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Email Delivery Failures</span>
                  <span className={`text-lg font-bold ${data.notifications.emailFailures > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {data.notifications.emailFailures}
                  </span>
                </div>
                {data.notifications.emailFailures > 0 && (
                   <p className="text-xs text-red-500 px-1">Warning: {data.notifications.emailFailures} emails failed to send. Check SMTP config.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminQuizzesOverview;
