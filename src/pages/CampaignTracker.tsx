import React, { useEffect, useState } from 'react';
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
