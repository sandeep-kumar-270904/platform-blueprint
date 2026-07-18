import os

def create_page(filename, component_name, content):
    filepath = os.path.join("src", "pages", filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {filepath}")

feedback_content = """import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const FeedbackThreads = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      // In a real app, this endpoint would fetch both requested and reviewing
      // For now, we mock some data to satisfy the UI requirement.
      setRequests([
        { _id: '1', resumeId: { title: 'Software Engineer' }, targetRole: 'Frontend Developer', status: 'pending', requestedAt: new Date().toISOString() },
        { _id: '2', resumeId: { title: 'Product Manager' }, targetRole: 'PM', status: 'in_progress', requestedAt: new Date().toISOString() }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl mt-16">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/resume-builder')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Feedback Threads</h1>
            <p className="text-muted-foreground">Manage your peer review requests and provide feedback.</p>
          </div>
        </div>

        <Tabs defaultValue="requested" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requested">My Requests</TabsTrigger>
            <TabsTrigger value="reviewing">Providing Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requested" className="space-y-4">
            {requests.map(req => (
              <Card key={req._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{req.resumeId?.title || 'Resume'}</CardTitle>
                      <CardDescription>Target Role: {req.targetRole}</CardDescription>
                    </div>
                    <Badge variant={req.status === 'pending' ? 'secondary' : 'default'}>
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Requested on {new Date(req.requestedAt).toLocaleDateString()}</p>
                  <Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 mr-2" /> View Feedback</Button>
                </CardContent>
              </Card>
            ))}
            {requests.length === 0 && <p className="text-muted-foreground">No requests found.</p>}
          </TabsContent>
          <TabsContent value="reviewing">
             <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">You are not currently reviewing any resumes.</p>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
export default FeedbackThreads;
"""

campaign_content = """import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CampaignTracker = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    // Mocking fetch
    setCampaigns([
      { _id: '1', name: 'Summer 2026 Internships', status: 'active', applicationCount: 12, responseRate: 25 },
      { _id: '2', name: 'Remote Frontend Roles', status: 'paused', applicationCount: 45, responseRate: 10 }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl mt-16">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/resume-builder')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Job Search Campaigns</h1>
              <p className="text-muted-foreground">Track application funnels and response rates across tailored resumes.</p>
            </div>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {campaigns.map(camp => (
            <Card key={camp._id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{camp.name}</CardTitle>
                  <Badge variant={camp.status === 'active' ? 'default' : 'secondary'}>{camp.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{camp.applicationCount}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Applications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{camp.responseRate}%</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Response Rate</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full"><Target className="h-4 w-4 mr-2" /> View Funnel</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};
export default CampaignTracker;
"""

benchmark_content = """import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PeerBenchmarking = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    // Mocking fetch
    setGroups([
      { _id: '1', name: 'Software Engineering Cohort 2026', memberCount: 5, avgAtsScore: 82, activeInterviews: 3 }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl mt-16">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/resume-builder')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Peer Benchmarking</h1>
              <p className="text-muted-foreground">Join accountability groups and benchmark your progress.</p>
            </div>
          </div>
          <Button><Users className="h-4 w-4 mr-2" /> Join Group</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {groups.map(group => (
            <Card key={group._id}>
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>{group.memberCount} Members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Group Average ATS</span>
                    <Badge variant="outline">{group.avgAtsScore}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Interviews</span>
                    <Badge>{group.activeInterviews}</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-6"><BarChart className="h-4 w-4 mr-2" /> View Leaderboard</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};
export default PeerBenchmarking;
"""

create_page("FeedbackThreads.tsx", "FeedbackThreads", feedback_content)
create_page("CampaignTracker.tsx", "CampaignTracker", campaign_content)
create_page("PeerBenchmarking.tsx", "PeerBenchmarking", benchmark_content)

