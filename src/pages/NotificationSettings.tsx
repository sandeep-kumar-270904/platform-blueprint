import { useState, useEffect } from "react";
import { Navigation } from "@/components/layout/Navigation"; // Or wherever the navbar is
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    job_board: {
      application_submitted: true,
      application_status_changed: true,
      new_applicant: true,
      job_deleted_by_admin: true,
      job_auto_hidden: true,
      recruiter_verified: true,
      recruiter_rejected: true,
      recruiter_banned: true,
      application_deadline_approaching: true,
    },
    liveSessionReminders: { inApp: true, email: true },
    liveSessionResults: { inApp: true, email: true },
    quizModeration: { inApp: true, email: true },
    leaderboardActivity: { inApp: true, email: true }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/settings/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences?.job_board) {
            setPreferences(prev => ({
              ...prev,
              job_board: { ...prev.job_board, ...data.preferences.job_board }
            }));
          }
          // Merge phase 3 fields
          const p3 = ['liveSessionReminders', 'liveSessionResults', 'quizModeration', 'leaderboardActivity'];
          p3.forEach(field => {
            if (data.preferences?.[field]) {
              setPreferences(prev => ({
                ...prev,
                [field]: { ...prev[field as keyof typeof prev], ...data.preferences[field] }
              }));
            }
          });
        }
      } catch (err) {
        console.error("Error fetching notification settings", err);
      }
    };
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const handleToggle = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      job_board: {
        ...prev.job_board,
        [key as keyof typeof prev.job_board]: !prev.job_board[key as keyof typeof prev.job_board]
      }
    }));
  };

  const handleQuizToggle = (category: string, channel: 'inApp' | 'email') => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [channel]: !(prev as any)[category][channel]
      }
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/settings/notifications`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
      });
      if (res.ok) {
        toast({ title: "Settings saved", description: "Your notification preferences have been updated." });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Board Notifications</CardTitle>
              <CardDescription>Manage alerts for jobs and applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(preferences.job_board).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="cursor-pointer capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Switch 
                    id={key} 
                    checked={value} 
                    onCheckedChange={() => handleToggle(key)} 
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz & Live Sessions</CardTitle>
              <CardDescription>Manage alerts for live quizzes, moderation, and leaderboards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'liveSessionReminders', label: 'Live Session Reminders' },
                { key: 'liveSessionResults', label: 'Live Session Results' },
                { key: 'quizModeration', label: 'Quiz Moderation (Reports/Deletions)' },
                { key: 'leaderboardActivity', label: 'Leaderboard Activity (Overtaken)' }
              ].map(cat => (
                <div key={cat.key} className="space-y-3">
                  <h4 className="font-medium">{cat.label}</h4>
                  <div className="flex items-center justify-between ml-4">
                    <Label htmlFor={`${cat.key}-inApp`} className="cursor-pointer text-muted-foreground">In-App Notification</Label>
                    <Switch 
                      id={`${cat.key}-inApp`} 
                      checked={(preferences as any)[cat.key].inApp} 
                      onCheckedChange={() => handleQuizToggle(cat.key, 'inApp')} 
                    />
                  </div>
                  <div className="flex items-center justify-between ml-4">
                    <Label htmlFor={`${cat.key}-email`} className="cursor-pointer text-muted-foreground">Email Notification</Label>
                    <Switch 
                      id={`${cat.key}-email`} 
                      checked={(preferences as any)[cat.key].email} 
                      onCheckedChange={() => handleQuizToggle(cat.key, 'email')} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={saveSettings} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
