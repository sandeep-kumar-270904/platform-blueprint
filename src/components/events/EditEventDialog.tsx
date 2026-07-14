import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface EditEventDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditEventDialog = ({ event, open, onOpenChange, onSuccess }: EditEventDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    venue: "",
    isVirtual: false,
    capacity: 100,
  });

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        venue: event.venue || "",
        isVirtual: event.isVirtual || false,
        capacity: event.capacity || 100,
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/events/${event._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update event");
      
      toast.success("Event updated! Note: Major changes may require re-approval.");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Event Title</Label>
            <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="min-h-[100px]" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time</Label>
              <Input type="datetime-local" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input type="datetime-local" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity} onChange={e => setForm({...form, capacity: +e.target.value})} required />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" id="isVirtualEdit" checked={form.isVirtual} onChange={e => setForm({...form, isVirtual: e.target.checked})} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="isVirtualEdit">Virtual Event</Label>
            </div>
          </div>
          {!form.isVirtual && (
            <div>
              <Label>Venue / Location</Label>
              <Input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
