import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Video, Loader2, DollarSign, Users, CalendarDays, Plus } from "lucide-react";
import { io } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const MentorSessionManagement = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot state
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setBookings(data.bookings);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchDashboard();
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      socket.on(`mentor_dashboard_updated_${user.id}`, () => {
        fetchDashboard();
      });
      return () => { socket.disconnect(); };
    }
  }, [user, token]);

  const handleAddSlot = async () => {
    if (!slotDate || !slotTime) return;
    setAddingSlot(true);
    
    // Parse local date/time string to ISO
    const [year, month, day] = slotDate.split('-');
    const [hours, minutes] = slotTime.split(':');
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/me/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          starts_at: start.toISOString(),
          ends_at: end.toISOString()
        })
      });

      if (!res.ok) throw new Error((await res.json()).message);
      
      toast({ title: "Slot added" });
      setSlotModalOpen(false);
      setSlotDate("");
      setSlotTime("");
      fetchDashboard();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAddingSlot(false);
    }
  };

  const isPast = (date: string) => new Date(date) < new Date();

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!profile || profile.verificationStatus !== 'approved') {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Not an active mentor</h3>
          <p className="text-muted-foreground">You need to be an approved mentor to access session management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h2>
          <p className="text-muted-foreground">Manage your availability and upcoming sessions.</p>
        </div>
        <Dialog open={slotModalOpen} onOpenChange={setSlotModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Availability Slot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Availability Slot</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label>Time (Local)</Label>
                <Input type="time" value={slotTime} onChange={e => setSlotTime(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleAddSlot} disabled={addingSlot || !slotDate || !slotTime}>
                {addingSlot && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Slot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Sessions</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{profile.totalSessions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Avg Rating</CardTitle><Star className="h-4 w-4 text-warning" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{Number(profile.rating).toFixed(1)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Hourly Rate</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{profile.pricePerHour}</div></CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-4">Your Booked Sessions</h3>
      {bookings.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="font-semibold text-lg mb-2">No bookings yet</h3>
            <p className="text-muted-foreground max-w-sm">When a mentee books one of your available slots, it will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map(booking => {
            const start = new Date(booking.slotId?.starts_at);
            const past = isPast(booking.slotId?.starts_at);
            
            return (
              <Card key={booking._id} className={past ? 'opacity-80' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarImage src={booking.menteeId?.avatar_url} />
                        <AvatarFallback>{booking.menteeId?.full_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{booking.menteeId?.full_name || "Mentee"}</div>
                        <div className="text-sm text-muted-foreground">{booking.menteeId?.email}</div>
                      </div>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : (booking.status === 'completed' ? 'secondary' : 'outline')}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {start.toLocaleDateString()}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  
                  {booking.notes && (
                    <div className="text-sm bg-muted/30 p-3 rounded border">
                      <span className="font-semibold block mb-1">Notes from mentee:</span>
                      {booking.notes}
                    </div>
                  )}

                  {booking.meetingLink && !past && (
                    <Button className="w-full gap-2" variant="outline" asChild>
                      <a href={booking.meetingLink} target="_blank" rel="noreferrer"><Video className="h-4 w-4" /> Start Video Call</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
