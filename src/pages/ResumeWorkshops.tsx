import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Users, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export const ResumeWorkshops: React.FC = () => {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchWorkshops = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/workshops`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWorkshops(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) fetchWorkshops();
  }, [token]);

  const handleJoin = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/workshops/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate(`/resume/workshops/${id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resume Workshops</h2>
          <p className="text-muted-foreground">Join live group sessions for real-time feedback and peer review.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'recruiter' || user?.role === 'mentor') && (
          <Button><Plus className="h-4 w-4 mr-2" /> Host Workshop</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workshops.map(w => (
          <Card key={w._id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{w.title}</CardTitle>
              <CardDescription>Hosted by {w.hostId?.name || 'Instructor'}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm mb-4 line-clamp-3">{w.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/> {new Date(w.scheduledFor).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {w.participantIds?.length || 0} / {w.maxParticipants}</span>
              </div>
            </CardContent>
            <CardFooter>
              {w.status === 'live' ? (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate(`/resume/workshops/${w._id}`)}>
                  Join Live Session <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button className="w-full" variant="outline" onClick={() => handleJoin(w._id)}>
                  {w.participantIds?.includes(user?._id) ? 'Already Registered' : 'Register to Attend'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
        {workshops.length === 0 && (
          <div className="col-span-full py-12 text-center border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No upcoming workshops found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
