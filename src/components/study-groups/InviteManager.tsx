import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Copy, X, Loader2 } from "lucide-react";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Props {
  groupId: string;
  groupName: string;
  trigger?: React.ReactNode;
}

export const InviteManager = ({ groupId, groupName, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const { invites, loading, createInvite, revoke } = useGroupInvites(open ? groupId : null);
  const [role, setRole] = useState("member");
  const [hours, setHours] = useState(72);
  const [uses, setUses] = useState(25);
  const [creating, setCreating] = useState(false);

  const inviteUrl = (token: string) =>
    `${window.location.origin}/invite/${token}`;

  const copy = (token: string) => {
    navigator.clipboard.writeText(inviteUrl(token));
    toast({ title: "Invite link copied" });
  };

  const handleCreate = async () => {
    setCreating(true);
    const result = await createInvite(role, hours, uses);
    setCreating(false);
    if (result) copy(result.token);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1">
            <Link2 className="h-4 w-4" /> Invite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite to {groupName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Expires (h)</Label>
            <Input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Max uses</Label>
            <Input type="number" min={1} max={500} value={uses} onChange={(e) => setUses(Number(e.target.value))} />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={creating} className="w-full gap-2">
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          Create invite link
        </Button>

        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Active invites</h4>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invites yet.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {invites.map((inv) => {
                const expired = new Date(inv.expires_at).getTime() < Date.now();
                const exhausted = inv.uses >= inv.max_uses;
                const dead = inv.revoked || expired || exhausted;
                return (
                  <div key={inv.id} className="flex items-center gap-2 text-xs p-2 rounded border">
                    <Badge variant={dead ? "destructive" : "secondary"} className="text-[10px]">{inv.role}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono truncate">{inv.token.slice(0, 16)}…</p>
                      <p className="text-muted-foreground">
                        {inv.uses}/{inv.max_uses} uses ·{" "}
                        {expired ? "expired" : `expires ${formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}`}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copy(inv.token)} disabled={dead}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {!inv.revoked && (
                      <Button size="icon" variant="ghost" onClick={() => revoke(inv.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
