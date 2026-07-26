import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useInviteMember } from "@/hooks/useTeams";
import { toast } from "sonner";
import { Search, UserPlus, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function InviteMemberDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { mutate: inviteMember, isPending } = useInviteMember();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${query}`);
      setResults(data || []);
    } catch (err) {
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = (userId: string, username: string) => {
    inviteMember(
      { teamId, userId },
      {
        onSuccess: () => {
          toast.success(`Invite sent to ${username}`);
          setOpen(false);
          setQuery("");
          setResults([]);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to invite user");
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Search for users by username or name to invite them to your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {results.length === 0 && !isSearching && query && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
            )}
            {results.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.username?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{user.full_name || user.username}</p>
                    {user.full_name && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleInvite(user._id, user.username)} disabled={isPending}>
                  Invite
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
