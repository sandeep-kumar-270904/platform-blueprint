import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MonitorUp, MessageSquare, ArrowLeft } from "lucide-react";
import { PeerFeedback } from '@/components/resume/PeerFeedback';

export const WorkshopSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [workshop, setWorkshop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/workshops/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWorkshop(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSession();
    // Simulate real-time updates for shared resumes
    const interval = setInterval(() => {
      if (token) fetchSession();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, token]);

  const handleShareMyResume = async () => {
    // In a real flow, present a modal to pick WHICH resume to share. For now, mock sending a dummy ID
    // assuming the backend allows it, or we need to pass a real resume ID the user owns.
    // For demo purposes, we will assume the user has a resume ID saved locally or we pick the first one.
    setSharing(true);
    try {
      const resumesRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resumes = await resumesRes.json();
      if (resumes.length > 0) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/workshops/${id}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ resumeId: resumes[0]._id })
        });
        fetchSession();
      } else {
        alert("You have no resumes to share.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!workshop) return <div>Session not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/resume/workshops')} className="-ml-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workshops
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{workshop.title}</h2>
          <p className="text-muted-foreground">{workshop.description}</p>
        </div>
        <Button onClick={handleShareMyResume} disabled={sharing} className="bg-indigo-600 hover:bg-indigo-700">
          {sharing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MonitorUp className="h-4 w-4 mr-2" />}
          Share My Resume
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Participants</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{workshop.participantIds?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">People joined this session</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Shared Resumes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {workshop.sharedResumes?.map((sr: any) => (
                <Button 
                  key={sr._id} 
                  variant={activeResumeId === sr._id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveResumeId(sr._id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {sr.user_id?.name || 'User'}'s Resume
                </Button>
              ))}
              {(!workshop.sharedResumes || workshop.sharedResumes.length === 0) && (
                <p className="text-xs text-muted-foreground">No resumes shared yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {activeResumeId ? (
            <Card className="min-h-[500px]">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Group Feedback Board</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <PeerFeedback resumeId={activeResumeId} />
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[500px] border rounded-lg border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
              <MonitorUp className="h-12 w-12 mb-4 opacity-50" />
              <p>Select a shared resume from the sidebar to review and leave comments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
