import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, BellRing } from 'lucide-react';

interface NotificationPreferences {
  question_answered: boolean;
  review_upvoted: boolean;
  answer_upvoted: boolean;
  event_reminder: boolean;
  event_approved: boolean;
  event_rejected: boolean;
  event_cancelled_or_changed: boolean;
  waitlist_promoted: boolean;
  course_reminder: boolean;
  course_streak_milestone: boolean;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/users/me/notification-preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      
      // Default all to true if missing
      setPreferences({
        question_answered: data.question_answered !== false,
        review_upvoted: data.review_upvoted !== false,
        answer_upvoted: data.answer_upvoted !== false,
        event_reminder: data.event_reminder !== false,
        event_approved: data.event_approved !== false,
        event_rejected: data.event_rejected !== false,
        event_cancelled_or_changed: data.event_cancelled_or_changed !== false,
        waitlist_promoted: data.waitlist_promoted !== false,
        course_reminder: data.course_reminder !== false,
        course_streak_milestone: data.course_streak_milestone !== false,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load preferences', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/users/me/notification-preferences`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!res.ok) throw new Error('Failed to save preferences');
      toast({ title: 'Saved', description: 'Notification preferences updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-4 w-4" /> Notification Preferences
        </CardTitle>
        <CardDescription>Choose which notifications you want to receive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Q&A and Reviews</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Question Answered</p>
              <p className="text-sm text-muted-foreground">When someone answers a question you asked.</p>
            </div>
            <Switch 
              checked={preferences?.question_answered} 
              onCheckedChange={() => handleToggle('question_answered')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Review Upvoted</p>
              <p className="text-sm text-muted-foreground">When someone finds your college review helpful.</p>
            </div>
            <Switch 
              checked={preferences?.review_upvoted} 
              onCheckedChange={() => handleToggle('review_upvoted')} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Answer Upvoted</p>
              <p className="text-sm text-muted-foreground">When someone upvotes your answer.</p>
            </div>
            <Switch 
              checked={preferences?.answer_upvoted} 
              onCheckedChange={() => handleToggle('answer_upvoted')} 
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Events</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Event Reminders & Feedback</p>
              <p className="text-sm text-muted-foreground">24h reminders and feedback requests for registered events.</p>
            </div>
            <Switch 
              checked={preferences?.event_reminder} 
              onCheckedChange={() => handleToggle('event_reminder')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Event Approved</p>
              <p className="text-sm text-muted-foreground">When an event you submitted is approved.</p>
            </div>
            <Switch 
              checked={preferences?.event_approved} 
              onCheckedChange={() => handleToggle('event_approved')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Event Rejected</p>
              <p className="text-sm text-muted-foreground">When an event you submitted is rejected.</p>
            </div>
            <Switch 
              checked={preferences?.event_rejected} 
              onCheckedChange={() => handleToggle('event_rejected')} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Event Cancelled or Changed</p>
              <p className="text-sm text-muted-foreground">When an event you registered for is cancelled or updated.</p>
            </div>
            <Switch 
              checked={preferences?.event_cancelled_or_changed} 
              onCheckedChange={() => handleToggle('event_cancelled_or_changed')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Waitlist Promoted</p>
              <p className="text-sm text-muted-foreground">When a spot opens up and you are moved off the waitlist.</p>
            </div>
            <Switch 
              checked={preferences?.waitlist_promoted} 
              onCheckedChange={() => handleToggle('waitlist_promoted')} 
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Learning & Courses</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Course Progress Reminders</p>
              <p className="text-sm text-muted-foreground">Gentle nudges when you haven't made progress on a course in a few days.</p>
            </div>
            <Switch 
              checked={preferences?.course_reminder} 
              onCheckedChange={() => handleToggle('course_reminder')} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Learning Streak Milestones</p>
              <p className="text-sm text-muted-foreground">Celebrations when you hit new learning streaks.</p>
            </div>
            <Switch 
              checked={preferences?.course_streak_milestone} 
              onCheckedChange={() => handleToggle('course_streak_milestone')} 
            />
          </div>
        </div>
        
        <div className="pt-6 border-t border-border flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
