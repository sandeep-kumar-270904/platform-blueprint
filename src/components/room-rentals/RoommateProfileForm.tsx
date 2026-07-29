import React, { useState, useEffect } from 'react';
import { useRoommates, RoommateProfile } from '@/hooks/useRoommates';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const RoommateProfileForm = () => {
  const { myProfile, upsertProfile } = useRoommates();
  const [formData, setFormData] = useState<Partial<RoommateProfile>>({
    cleanliness: 'Average',
    sleepSchedule: 'Flexible',
    noiseTolerance: 'Medium',
    smoking: 'No',
    pets: 'No',
    budgetRange: { min: 0, max: 1000 },
    moveInDate: new Date().toISOString().split('T')[0],
    bio: ''
  });

  useEffect(() => {
    if (myProfile.data) {
      setFormData({
        cleanliness: myProfile.data.cleanliness,
        sleepSchedule: myProfile.data.sleepSchedule,
        noiseTolerance: myProfile.data.noiseTolerance,
        smoking: myProfile.data.smoking,
        pets: myProfile.data.pets,
        budgetRange: myProfile.data.budgetRange,
        moveInDate: new Date(myProfile.data.moveInDate).toISOString().split('T')[0],
        bio: myProfile.data.bio
      });
    }
  }, [myProfile.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertProfile.mutate(formData);
  };

  if (myProfile.isLoading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card border rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-2">My Roommate Profile</h2>
      <p className="text-muted-foreground mb-6">Set your lifestyle preferences to find compatible roommates.</p>

      {upsertProfile.isSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
          Profile saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Cleanliness</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.cleanliness}
              onChange={e => setFormData({ ...formData, cleanliness: e.target.value as any })}
            >
              <option value="Messy">Messy</option>
              <option value="Average">Average</option>
              <option value="Clean">Clean</option>
              <option value="Neat Freak">Neat Freak</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Sleep Schedule</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.sleepSchedule}
              onChange={e => setFormData({ ...formData, sleepSchedule: e.target.value as any })}
            >
              <option value="Early Bird">Early Bird</option>
              <option value="Night Owl">Night Owl</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Noise Tolerance</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.noiseTolerance}
              onChange={e => setFormData({ ...formData, noiseTolerance: e.target.value as any })}
            >
              <option value="Low">Low (Need quiet)</option>
              <option value="Medium">Medium</option>
              <option value="High">High (Don't mind noise)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Smoking</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.smoking}
              onChange={e => setFormData({ ...formData, smoking: e.target.value as any })}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Outside only">Outside only</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Pets</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.pets}
              onChange={e => setFormData({ ...formData, pets: e.target.value as any })}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Cats only">Cats only</option>
              <option value="Dogs only">Dogs only</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Preferred Move-in Date</Label>
            <Input 
              type="date" 
              required
              value={formData.moveInDate}
              onChange={e => setFormData({ ...formData, moveInDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Budget Range ($/month)</Label>
          <div className="flex items-center gap-4">
            <Input 
              type="number" 
              placeholder="Min" 
              value={formData.budgetRange?.min}
              onChange={e => setFormData({ ...formData, budgetRange: { ...formData.budgetRange!, min: Number(e.target.value) } })}
            />
            <span className="text-muted-foreground">to</span>
            <Input 
              type="number" 
              placeholder="Max" 
              value={formData.budgetRange?.max}
              onChange={e => setFormData({ ...formData, budgetRange: { ...formData.budgetRange!, max: Number(e.target.value) } })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Bio (Optional)</Label>
          <Textarea 
            placeholder="Tell potential roommates a bit about yourself..."
            rows={4}
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={upsertProfile.isPending} className="w-full">
          {upsertProfile.isPending ? 'Saving...' : myProfile.data ? 'Update Profile' : 'Create Profile'}
        </Button>
      </form>
    </div>
  );
};
