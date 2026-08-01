import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Type } from "lucide-react";

interface RoommateMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

export const RoommateMeetupModal: React.FC<RoommateMeetupModalProps> = ({ isOpen, onClose, chatId }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [syncToCalendar, setSyncToCalendar] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
      toast({ title: 'Missing fields', description: 'Please fill out all required fields.', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const dateTimeStr = `${date}T${time}:00`;

      const res = await fetch(`${API_URL}/api/roommates/calendar/meetup/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          date: dateTimeStr,
          location,
          syncToCalendar
        })
      });

      if (!res.ok) throw new Error('Failed to schedule meetup');

      toast({
        title: "Meetup Scheduled",
        description: syncToCalendar ? "Meetup saved and synced to your calendar." : "Meetup saved to chat.",
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not schedule meetup. Try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a Meetup</DialogTitle>
          <DialogDescription>
            Plan a time to meet your potential roommate or group.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title (Required)</label>
            <div className="relative">
              <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="e.g. Coffee at Starbucks" 
                className="pl-9"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date (Required)</label>
              <div className="relative">
                <Input 
                  type="date"
                  className="pl-3"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time (Required)</label>
              <div className="relative">
                <Input 
                  type="time"
                  className="pl-3"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location (Optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="e.g. 123 Main St" 
                className="pl-9"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="syncCal" 
              className="rounded border-gray-300"
              checked={syncToCalendar}
              onChange={e => setSyncToCalendar(e.target.checked)}
            />
            <label htmlFor="syncCal" className="text-sm cursor-pointer flex items-center gap-1">
              <Calendar className="w-4 h-4 text-primary" />
              Add to my Calendar
            </label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Meetup'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
