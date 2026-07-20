import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, BookOpen, PenTool, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminCommunity: React.FC = () => {
  const [circles, setCircles] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [circlesRes, storiesRes] = await Promise.all([
        fetch(`${API_URL}/api/scholarships/admin/circles`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/scholarships/admin/awardee-stories?isVerified=false`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (circlesRes.ok) setCircles(await circlesRes.json());
      if (storiesRes.ok) setStories(await storiesRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Scholarship Circles Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /> Scholarship Circles</CardTitle>
            <CardDescription>Active peer-to-peer communities.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : circles.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active circles.</div>
            ) : (
              <div className="space-y-4">
                {circles.slice(0,5).map(c => (
                  <div key={c._id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <Badge variant="secondary">{c.members?.length || 0} Members</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Essay Stats Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PenTool className="h-5 w-5 text-indigo-600" /> Essay Engagement</CardTitle>
            <CardDescription>Platform-wide essay response metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p className="mb-4">Essay tracking is aggregated directly through active scholarship applications. A unified dashboard view is coming soon.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-indigo-700">12k+</div>
                  <div className="text-xs text-indigo-600">Essays Drafted</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-indigo-700">85%</div>
                  <div className="text-xs text-indigo-600">Completion Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Awardee Story Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-green-600" /> Awardee Story Moderation</CardTitle>
          <CardDescription>Review and verify unverified stories submitted by awardees.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : stories.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-50" />
              All caught up! No unverified stories in queue.
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map(s => (
                <div key={s._id} className="border p-4 rounded bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{s.scholarshipId?.title || 'Unknown Scholarship'}</h4>
                      <p className="text-xs text-muted-foreground">Submitted by {s.userId?.name || 'Unknown'} on {format(new Date(s.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Unverified</Badge>
                  </div>
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap mt-2">{s.storyText}</div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" className="text-red-600">Reject</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">Verify & Publish</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
