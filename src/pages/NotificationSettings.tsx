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
import { Badge } from "@/components/ui/badge";

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
    liveSessionReminders: { inApp: true, email: true, push: false },
    liveSessionResults: { inApp: true, email: true, push: false },
    quizModeration: { inApp: true, email: true, push: false },
    leaderboardActivity: { inApp: true, email: true, push: false },
    mentorUpdates: { inApp: true, email: true, push: false },
    subscriptions: { inApp: true, email: true, push: false },
    communityForums: { inApp: true, email: true, push: false },
    cohorts: { inApp: true, email: true, push: false },
    learningPaths: { inApp: true, email: true, push: false }
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
          // Merge phase 3-9 fields
          const p3 = ['liveSessionReminders', 'liveSessionResults', 'quizModeration', 'leaderboardActivity', 'mentorUpdates', 'subscriptions', 'communityForums', 'cohorts', 'learningPaths'];
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

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBtc3sOEz0y5ZlX5O4iL-sMjk';
        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    } catch (err) {
      console.error('Failed to subscribe to push', err);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleQuizToggle = async (category: string, channel: 'inApp' | 'email' | 'push') => {
    if (channel === 'push' && !(preferences as any)[category].push) {
      // User is enabling push
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPush();
      } else {
        toast({ title: "Permission Denied", description: "You must allow notifications in your browser.", variant: "destructive" });
        return;
      }
    }
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
                  <div className="flex items-center justify-between ml-4">
                    <Label htmlFor={`${cat.key}-push`} className="cursor-pointer text-muted-foreground flex items-center gap-2">
                      Push Notification <Badge variant="secondary" className="text-[10px] px-1 py-0">New</Badge>
                    </Label>
                    <Switch 
                      id={`${cat.key}-push`} 
                      checked={(preferences as any)[cat.key].push || false} 
                      onCheckedChange={() => handleQuizToggle(cat.key, 'push')} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mentors & Community</CardTitle>
              <CardDescription>Manage alerts for mentorship, subscriptions, forums, and learning paths</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'mentorUpdates', label: 'Mentor Updates (Disputes, Referrals)' },
                { key: 'subscriptions', label: 'Subscription Renewals & Failures' },
                { key: 'communityForums', label: 'Community Forum Replies' },
                { key: 'cohorts', label: 'Cohort Sessions' },
                { key: 'learningPaths', label: 'AI Learning Path Suggestions' }
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
                  <div className="flex items-center justify-between ml-4">
                    <Label htmlFor={`${cat.key}-push`} className="cursor-pointer text-muted-foreground flex items-center gap-2">
                      Push Notification <Badge variant="secondary" className="text-[10px] px-1 py-0">New</Badge>
                    </Label>
                    <Switch 
                      id={`${cat.key}-push`} 
                      checked={(preferences as any)[cat.key].push || false} 
                      onCheckedChange={() => handleQuizToggle(cat.key, 'push')} 
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
