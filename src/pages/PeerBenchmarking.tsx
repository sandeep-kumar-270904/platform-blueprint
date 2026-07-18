import React, { useEffect, useState } from 'react';
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
