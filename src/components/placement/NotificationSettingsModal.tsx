import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal = ({ isOpen, onClose }: NotificationSettingsModalProps) => {
  const [settings, setSettings] = useState({
    mock_reminders: true,
    streak_alerts: true,
    new_content: true,
    booking_status: true,
    feedback_prompts: true,
    milestones: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        // Normally we'd fetch the explicit notification preferences endpoint
        // Assuming a mock fetch for now or pulling from standard preferences endpoint
        const data = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/preferences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json());
        
        if (data && data.toggles && data.toggles.placement) {
          setSettings(data.toggles.placement);
        }
      }
    } catch (err) {
      console.error('Error fetching settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          toggles: {
            placement: settings
          },
          // Auto-detect timezone for server streak logic
          quiet_hours: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });
      onClose();
    } catch (err) {
      console.error('Error saving settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Placement Notifications</DialogTitle>
          <DialogDescription>
            Choose what you want to be notified about.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-4 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mock Interview Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive alerts 24h and 1h before your sessions.</p>
              </div>
              <Switch checked={settings.mock_reminders} onCheckedChange={() => handleToggle('mock_reminders')} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Booking Status</Label>
                <p className="text-sm text-muted-foreground">Get notified when sessions are confirmed or cancelled.</p>
              </div>
              <Switch checked={settings.booking_status} onCheckedChange={() => handleToggle('booking_status')} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Streak Alerts</Label>
                <p className="text-sm text-muted-foreground">Get a reminder when your streak is about to end.</p>
              </div>
              <Switch checked={settings.streak_alerts} onCheckedChange={() => handleToggle('streak_alerts')} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Milestones</Label>
                <p className="text-sm text-muted-foreground">Celebrate achievements like solving 50 DSA problems.</p>
              </div>
              <Switch checked={settings.milestones} onCheckedChange={() => handleToggle('milestones')} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Feedback Prompts</Label>
                <p className="text-sm text-muted-foreground">Reminders to rate your completed mock interviews.</p>
              </div>
              <Switch checked={settings.feedback_prompts} onCheckedChange={() => handleToggle('feedback_prompts')} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Target Company Updates</Label>
                <p className="text-sm text-muted-foreground">Alerts for new content related to your starred companies.</p>
              </div>
              <Switch checked={settings.new_content} onCheckedChange={() => handleToggle('new_content')} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={saveSettings} disabled={isLoading || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
