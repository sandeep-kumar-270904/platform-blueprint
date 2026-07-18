import React, { useEffect, useState } from 'react';
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
