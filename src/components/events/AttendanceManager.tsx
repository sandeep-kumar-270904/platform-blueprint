import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEventAttendance } from "@/hooks/useEventAttendance";
import { Download, ClipboardCheck, CheckCircle2 } from "lucide-react";

interface Props {
  eventId: string;
  eventTitle: string;
  isOrganizer: boolean;
  isRegistered: boolean;
  trigger?: React.ReactNode;
}

export const AttendanceManager = ({ eventId, eventTitle, isOrganizer, isRegistered, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const { rows, profiles, checkIn, exportCsv } = useEventAttendance(open ? eventId : null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1">
            <ClipboardCheck className="h-4 w-4" /> Attendance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>Attendance · {eventTitle}</span>
            <Badge variant="secondary">{rows.length} checked in</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isRegistered && (
            <Button size="sm" onClick={() => checkIn()} className="gap-1">
              <CheckCircle2 className="h-4 w-4" /> Check myself in
            </Button>
          )}
          {isOrganizer && (
            <Button size="sm" variant="outline" onClick={() => exportCsv(eventTitle)} className="gap-1">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {rows.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">No check-ins yet.</p>
          ) : (
            <div className="space-y-1">
              {rows.map((r) => {
                const p = profiles[r.user_id];
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded hover:bg-muted text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p?.full_name || "Member"}</p>
                      {p?.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{r.method}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(r.checked_in_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
