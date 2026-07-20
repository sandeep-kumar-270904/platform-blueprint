import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SavingsGoalTrackerProps {
  awardedSum: number;
}

export const SavingsGoalTracker: React.FC<SavingsGoalTrackerProps> = ({ awardedSum }) => {
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    targetAmount: '',
    targetDate: '',
    linkedInstitutionName: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, []);

  const fetchGoal = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/savings-goal`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoal(data);
        if (data) {
          setFormData({
            targetAmount: data.targetAmount.toString(),
            targetDate: data.targetDate ? new Date(data.targetDate).toISOString().split('T')[0] : '',
            linkedInstitutionName: data.linkedInstitutionName || ''
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const method = goal ? 'PATCH' : 'POST';
      const res = await fetch(`${API_URL}/api/scholarships/savings-goal`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetAmount: Number(formData.targetAmount),
          targetDate: formData.targetDate || undefined,
          linkedInstitutionName: formData.linkedInstitutionName || undefined
        })
      });
      if (res.ok) {
        toast.success(`Goal ${goal ? 'updated' : 'created'} successfully!`);
        setIsEditing(false);
        fetchGoal();
      } else {
        toast.error(`Failed to ${goal ? 'update' : 'create'} goal.`);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></CardContent>
      </Card>
    );
  }

  if (!goal || isEditing) {
    return (
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Target className="w-5 h-5" /> {goal ? 'Edit Savings Goal' : 'Set a Savings Goal'}
          </CardTitle>
          <CardDescription>Track your awarded funding against your target tuition or expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="targetAmount">Target Amount ($) *</Label>
              <Input 
                id="targetAmount" 
                type="number" 
                required 
                min="1"
                value={formData.targetAmount}
                onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                placeholder="e.g. 15000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetDate">Target Date (Optional)</Label>
              <Input 
                id="targetDate" 
                type="date" 
                value={formData.targetDate}
                onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedInstitutionName">Institution Name (Optional)</Label>
              <Input 
                id="linkedInstitutionName" 
                type="text" 
                value={formData.linkedInstitutionName}
                onChange={(e) => setFormData({...formData, linkedInstitutionName: e.target.value})}
                placeholder="e.g. State University"
              />
            </div>
            <div className="flex gap-2 justify-end">
              {goal && (
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    targetAmount: goal.targetAmount.toString(),
                    targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
                    linkedInstitutionName: goal.linkedInstitutionName || ''
                  });
                }}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {goal ? 'Save Changes' : 'Set Goal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.min(100, Math.round((awardedSum / goal.targetAmount) * 100)) || 0;

  return (
    <Card className="mb-6 border-primary/20 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary h-8 px-2">
          <Edit2 className="w-4 h-4 mr-1" /> Edit goal
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-primary flex items-center gap-2 text-lg">
          <Target className="w-5 h-5" /> Your Savings Goal
        </CardTitle>
        <CardDescription>
          {goal.linkedInstitutionName ? `Saving for ${goal.linkedInstitutionName}` : 'Tracking your funding progress'}
          {goal.targetDate && ` • Target by ${new Date(goal.targetDate).toLocaleDateString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-6">
        <div className="flex justify-between items-end mb-2">
          <div className="text-2xl font-bold">
            ${awardedSum.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ ${goal.targetAmount.toLocaleString()}</span>
          </div>
          <div className="text-primary font-semibold text-lg">{progressPercentage}%</div>
        </div>
        <Progress value={progressPercentage} className="h-3" />
        {progressPercentage >= 100 && (
          <p className="text-green-600 text-sm mt-3 font-medium flex items-center gap-1">
            🎉 Congratulations! You have reached your savings goal!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
