import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ReminderSettingsModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [intervals, setIntervals] = useState<number[]>([3, 7, 14]);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  
  // Phase 8 preferences
  const [prefs, setPrefs] = useState({
    applicationUpdates: true,
    deadlineReminders: true,
    recommendationLetters: true,
    reviewOutcomes: true,
    adminDecisions: true,
    circleActivity: true,
    storyDecisions: true,
    institutionalAwards: true,
    complianceReminders: true,
    archivedCycles: true,
    newMatches: true,
    essayFeedback: true,
    fundingStackingAlerts: true,
    portfolioOptimization: true,
    employerFastTrack: true,
    apiSyncAlerts: true
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/reminder-preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scholarshipReminderIntervals) setIntervals(data.scholarshipReminderIntervals);
        if (data.weeklyDigestEnabled !== undefined) setWeeklyDigest(data.weeklyDigestEnabled);
        
        setPrefs(prev => ({
          applicationUpdates: data.applicationUpdates ?? prev.applicationUpdates,
          deadlineReminders: data.deadlineReminders ?? prev.deadlineReminders,
          recommendationLetters: data.recommendationLetters ?? prev.recommendationLetters,
          reviewOutcomes: data.reviewOutcomes ?? prev.reviewOutcomes,
          adminDecisions: data.adminDecisions ?? prev.adminDecisions,
          circleActivity: data.circleActivity ?? prev.circleActivity,
          storyDecisions: data.storyDecisions ?? prev.storyDecisions,
          institutionalAwards: data.institutionalAwards ?? prev.institutionalAwards,
          complianceReminders: data.complianceReminders ?? prev.complianceReminders,
          archivedCycles: data.archivedCycles ?? prev.archivedCycles,
          newMatches: data.newMatches ?? prev.newMatches,
          essayFeedback: data.essayFeedback ?? prev.essayFeedback,
          fundingStackingAlerts: data.fundingStackingAlerts ?? prev.fundingStackingAlerts,
          portfolioOptimization: data.portfolioOptimization ?? prev.portfolioOptimization,
          employerFastTrack: data.employerFastTrack ?? prev.employerFastTrack,
          apiSyncAlerts: data.apiSyncAlerts ?? prev.apiSyncAlerts
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/reminder-preferences`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scholarshipReminderIntervals: intervals,
          weeklyDigestEnabled: weeklyDigest,
          ...prefs
        })
      });
      
      if (res.ok) {
        toast.success("Reminder preferences updated");
        setOpen(false);
      } else {
        toast.error("Failed to save preferences");
      }
    } catch (err) {
      toast.error("An error occurred");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleIntervalChange = (val: number, checked: boolean) => {
    if (checked) {
      setIntervals(prev => [...prev, val].sort((a,b) => a-b));
    } else {
      setIntervals(prev => prev.filter(i => i !== val));
    }
  };

  const handlePrefChange = (key: keyof typeof prefs) => (checked: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: checked }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" /> Notification Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="grid md:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold border-b pb-2">Deadlines & Intervals</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="int-3" checked={intervals.includes(3)} onCheckedChange={(c) => handleIntervalChange(3, c === true)} />
                    <Label htmlFor="int-3">3 Days Before</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="int-7" checked={intervals.includes(7)} onCheckedChange={(c) => handleIntervalChange(7, c === true)} />
                    <Label htmlFor="int-7">1 Week Before (7 Days)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="int-14" checked={intervals.includes(14)} onCheckedChange={(c) => handleIntervalChange(14, c === true)} />
                    <Label htmlFor="int-14">2 Weeks Before (14 Days)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="int-30" checked={intervals.includes(30)} onCheckedChange={(c) => handleIntervalChange(30, c === true)} />
                    <Label htmlFor="int-30">1 Month Before (30 Days)</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold border-b pb-2">General Summaries</h4>
                  <div className="flex items-center justify-between">
                    <Label>Weekly Digest</Label>
                    <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>New Scholarship Matches</Label>
                    <Switch checked={prefs.newMatches} onCheckedChange={handlePrefChange('newMatches')} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold border-b pb-2">Application & Status Alerts</h4>
                  <div className="flex items-center justify-between">
                    <Label>Application Updates</Label>
                    <Switch checked={prefs.applicationUpdates} onCheckedChange={handlePrefChange('applicationUpdates')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Deadline Reminders</Label>
                    <Switch checked={prefs.deadlineReminders} onCheckedChange={handlePrefChange('deadlineReminders')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Recommendation Letters</Label>
                    <Switch checked={prefs.recommendationLetters} onCheckedChange={handlePrefChange('recommendationLetters')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Review Outcomes</Label>
                    <Switch checked={prefs.reviewOutcomes} onCheckedChange={handlePrefChange('reviewOutcomes')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Essay Feedback (Coach)</Label>
                    <Switch checked={prefs.essayFeedback} onCheckedChange={handlePrefChange('essayFeedback')} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold border-b pb-2">Community & Administration</h4>
                  <div className="flex items-center justify-between">
                    <Label>Admin Decisions</Label>
                    <Switch checked={prefs.adminDecisions} onCheckedChange={handlePrefChange('adminDecisions')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Circle Activity</Label>
                    <Switch checked={prefs.circleActivity} onCheckedChange={handlePrefChange('circleActivity')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Story Decisions</Label>
                    <Switch checked={prefs.storyDecisions} onCheckedChange={handlePrefChange('storyDecisions')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>API Sync Alerts</Label>
                    <Switch checked={prefs.apiSyncAlerts} onCheckedChange={handlePrefChange('apiSyncAlerts')} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold border-b pb-2">Awards & Post-Award</h4>
                  <div className="flex items-center justify-between">
                    <Label>Institutional Awards</Label>
                    <Switch checked={prefs.institutionalAwards} onCheckedChange={handlePrefChange('institutionalAwards')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Compliance Reminders</Label>
                    <Switch checked={prefs.complianceReminders} onCheckedChange={handlePrefChange('complianceReminders')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Archived Cycles</Label>
                    <Switch checked={prefs.archivedCycles} onCheckedChange={handlePrefChange('archivedCycles')} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold border-b pb-2">Financial & Optimization</h4>
                  <div className="flex items-center justify-between">
                    <Label>Funding Stacking Alerts</Label>
                    <Switch checked={prefs.fundingStackingAlerts} onCheckedChange={handlePrefChange('fundingStackingAlerts')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Portfolio Optimization Suggestions</Label>
                    <Switch checked={prefs.portfolioOptimization} onCheckedChange={handlePrefChange('portfolioOptimization')} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Employer Fast-Track Invites</Label>
                    <Switch checked={prefs.employerFastTrack} onCheckedChange={handlePrefChange('employerFastTrack')} />
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
