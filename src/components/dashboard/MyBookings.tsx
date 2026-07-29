import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyBookings } from "@/hooks/useMyBookings";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Video, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

export const MyBookings = ({ userId }: { userId: string }) => {
  const { bookings, loading, cancel } = useMyBookings(userId);
  const { toast } = useToast();

  const upcoming = bookings.filter((b) => ["pending", "confirmed"].includes(b.status) && new Date(b.scheduled_at) >= new Date());

  const onCancel = async (id: string) => {
    const err = await cancel(id);
    if (err) toast({ title: "Failed", description: err.message, variant: "destructive" });
    else toast({ title: "Booking cancelled" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="h-4 w-4" />My Mentor Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No upcoming bookings.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card/50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.mentor_profile?.full_name || b.mentor_profile?.username || "Mentor"}</p>
                  <p className="text-xs text-muted-foreground">{b.mentor?.title}{b.mentor?.company ? ` · ${b.mentor.company}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(b.scheduled_at), "MMM d, h:mm a")} · {b.duration_minutes}min</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{b.status}</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  {b.video_link && <Button asChild size="sm" variant="ghost"><a href={b.video_link} target="_blank" rel="noreferrer"><Video className="h-3.5 w-3.5" /></a></Button>}
                  <Button size="sm" variant="ghost" onClick={() => onCancel(b.id)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
