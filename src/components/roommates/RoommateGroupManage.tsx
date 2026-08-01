import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RoommateVerificationBadge } from './RoommateVerificationBadge';

interface RoommateGroupManageProps {
  group: any;
  onUpdate: () => void;
  myUserId?: string;
  onOpenChat?: (id: string, groupName: string) => void;
}

export const RoommateGroupManage: React.FC<RoommateGroupManageProps> = ({ group, onUpdate, myUserId, onOpenChat }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const isAdmin = group.admin._id === myUserId;

  const handleAction = async (userId: string, action: 'accept' | 'reject' | 'remove') => {
    setLoading(userId);
    try {
      const endpoint = action === 'remove' 
        ? `/api/roommates/groups/${group._id}/remove`
        : `/api/roommates/groups/${group._id}/respond`;
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, action: action !== 'remove' ? action : undefined })
      });

      if (res.ok) {
        toast({ title: "Success", description: `User ${action}ed.` });
        onUpdate();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Action failed');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleLeave = async () => {
    setLoading('leave');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/groups/${group._id}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast({ title: "Left Group", description: "You have left the group." });
        onUpdate();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to leave group');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-primary/20">
      <CardHeader className="bg-secondary/10 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {group.name}
              {isAdmin && <Badge variant="default" className="text-[10px]">Admin</Badge>}
            </CardTitle>
            <CardDescription className="mt-1">{group.members.length} of {group.targetSize} Members • {group.status}</CardDescription>
          </div>
          {onOpenChat && (
            <Button variant="outline" size="sm" onClick={() => onOpenChat(group._id, group.name)}>
              Open Chat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        
        {isAdmin && group.pendingRequests?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 border-b pb-1">Pending Requests ({group.pendingRequests.length})</h4>
            <div className="space-y-3">
              {group.pendingRequests.map((reqUser: any) => (
                <div key={reqUser._id} className="flex items-center justify-between bg-card border rounded-md p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={reqUser.profilePicture || reqUser.avatar_url} />
                      <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {reqUser.name || reqUser.full_name}
                        <RoommateVerificationBadge status={reqUser.verificationStatus || 'none'} />
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8"
                      onClick={() => handleAction(reqUser._id, 'reject')}
                      disabled={loading === reqUser._id}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8"
                      onClick={() => handleAction(reqUser._id, 'accept')}
                      disabled={loading === reqUser._id || group.members.length >= group.targetSize}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold mb-3 border-b pb-1">Members</h4>
          <div className="space-y-3">
            {group.members.map((member: any) => (
              <div key={member._id} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.profilePicture || member.avatar_url} />
                    <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                  </Avatar>
                  <p className="text-sm">
                    {member.name || member.full_name} {member._id === myUserId && '(You)'}
                    {member._id === group.admin._id && <Badge variant="secondary" className="ml-2 text-[10px]">Admin</Badge>}
                  </p>
                </div>
                {isAdmin && member._id !== myUserId && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleAction(member._id, 'remove')}
                    disabled={loading === member._id}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isAdmin && (
          <div className="pt-4 border-t mt-4">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLeave} 
              disabled={loading === 'leave'}
            >
              Leave Group
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { User } from 'lucide-react';
