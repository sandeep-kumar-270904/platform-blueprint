import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface RoommateGroupCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const RoommateGroupCreateModal: React.FC<RoommateGroupCreateModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetSize: 2,
    budgetMin: 0,
    budgetMax: 1000,
    preferredLocations: '',
    moveInDate: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        targetSize: Number(formData.targetSize),
        budgetRange: { min: Number(formData.budgetMin), max: Number(formData.budgetMax) },
        preferredLocations: formData.preferredLocations.split(',').map(s => s.trim()).filter(Boolean),
        moveInDate: formData.moveInDate || undefined
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create group');
      }

      toast({
        title: "Group created!",
        description: "Your roommate group is now active and discoverable.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[90vh] md:h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Roommate Group</DialogTitle>
          <DialogDescription>
            Form a group to look for a place together. Others can discover your group and request to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input 
                id="name"
                required
                placeholder="e.g. 3BHK seekers in Downtown"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                required
                placeholder="What kind of place are you looking for? What's the vibe?"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetSize">Target Group Size</Label>
              <Input 
                id="targetSize"
                type="number"
                min={2}
                max={10}
                required
                value={formData.targetSize}
                onChange={e => setFormData({...formData, targetSize: Number(e.target.value)})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Min Rent ($/mo)</Label>
                <Input 
                  id="budgetMin"
                  type="number"
                  required
                  value={formData.budgetMin}
                  onChange={e => setFormData({...formData, budgetMin: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Max Rent ($/mo)</Label>
                <Input 
                  id="budgetMax"
                  type="number"
                  required
                  value={formData.budgetMax}
                  onChange={e => setFormData({...formData, budgetMax: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLocations">Preferred Locations (comma separated)</Label>
              <Input 
                id="preferredLocations"
                placeholder="Downtown, North Campus, etc."
                value={formData.preferredLocations}
                onChange={e => setFormData({...formData, preferredLocations: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveInDate">Target Move-in Date</Label>
              <Input 
                id="moveInDate"
                type="date"
                value={formData.moveInDate}
                onChange={e => setFormData({...formData, moveInDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
