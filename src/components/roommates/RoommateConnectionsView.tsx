import React from "react";
import { RoommateMatch } from "@/pages/RoommateFind";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, UserPlus, Trash2, CheckCircle2, MapPin, MoreVertical, Flag, ShieldBan } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportUserModal } from "@/components/roommates/ReportUserModal";
import { RoommateVerificationBadge } from "@/components/roommates/RoommateVerificationBadge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserMinus } from "lucide-react";

interface RoommateConnectionsViewProps {
  connections: any[];
  myProfile: any;
  onRespond: (connectionId: string, status: 'Accepted' | 'Declined') => void;
  onWithdraw: (connectionId: string) => void;
  onUnmatch: (connectionId: string) => void;
  onProfileSelect: (profile: RoommateMatch) => void;
  onMessage?: (connectionId: string, otherUser: any) => void;
}

export const RoommateConnectionsView: React.FC<RoommateConnectionsViewProps> = ({
  connections,
  myProfile,
  onRespond,
  onWithdraw,
  onUnmatch,
  onProfileSelect,
  onMessage
}) => {
  if (!myProfile || !myProfile.user) return null;
  const myUserId = myProfile.user._id;
  const { toast } = useToast();
  
  const [reportingUser, setReportingUser] = React.useState<{id: string, name: string} | null>(null);

  const handleBlock = async (targetUserId: string, targetUserName: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/safety/block`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        toast({ title: "User Blocked", description: `${targetUserName} has been blocked.` });
        window.location.reload();
      } else {
        throw new Error('Failed to block');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const receivedRequests = connections.filter(c => c.status === 'Pending' && c.recipient._id === myUserId);
  const sentRequests = connections.filter(c => c.status === 'Pending' && c.requester._id === myUserId);
  const connected = connections.filter(c => c.status === 'Accepted');

  const renderConnectionCard = (conn: any, type: 'received' | 'sent' | 'connected') => {
    const profile = conn.otherProfile as RoommateMatch;
    
    // Graceful fallback if profile was deleted or hasn't created one
    if (!profile) return null;

    return (
      <li key={conn._id} className="list-none">
        <Card className="overflow-hidden hover:shadow-lg transition-all border-border/50 bg-background/50 backdrop-blur-sm flex flex-col group h-full">
          <CardHeader 
            className="pb-4 cursor-pointer relative"
            onClick={() => onProfileSelect(profile)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onProfileSelect(profile);
              }
            }}
            aria-label={`View ${profile.user.name}'s profile`}
          >
          {profile.profilePhoto && (
             <div className="absolute top-0 left-0 right-0 h-16 bg-secondary/30 opacity-50 overflow-hidden z-0">
                 <img src={profile.profilePhoto} alt="Cover" className="w-full h-full object-cover blur-sm" />
             </div>
          )}
          <div className="flex items-start gap-4 relative z-10 pt-2">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              {profile.profilePhoto ? (
                <AvatarImage src={profile.profilePhoto} alt={profile.user.name} className="object-cover" />
              ) : profile.user.profilePicture ? (
                <AvatarImage src={profile.user.profilePicture} alt={profile.user.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {profile.user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">{profile.user.name}</h3>
                <RoommateVerificationBadge status={profile.verificationStatus} />
              </div>
              <Badge variant={profile.compatibilityScore >= 80 ? "default" : "secondary"} className="mt-1">
                {profile.compatibilityScore}% Match
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent 
          className="space-y-2 flex-1 cursor-pointer pt-0"
          onClick={() => onProfileSelect(profile)}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <MapPin className="h-4 w-4 shrink-0" />
             <span className="truncate">
               {profile.preferredLocations && profile.preferredLocations.length > 0 
                  ? profile.preferredLocations.join(", ") 
                  : "Open location"}
             </span>
          </div>
          <p className="text-sm font-medium">Budget: ${profile.budgetRange.min} - ${profile.budgetRange.max}</p>
        </CardContent>

        <CardFooter className="pt-4 border-t bg-secondary/10 flex gap-2">
          {type === 'received' && (
            <>
              <Button variant="default" className="flex-1 min-h-[44px]" onClick={() => onRespond(conn._id, 'Accepted')} aria-label={`Accept connection from ${profile.user.name}`}>
                Accept
              </Button>
              <Button variant="destructive" className="flex-1 min-h-[44px]" onClick={() => onRespond(conn._id, 'Declined')} aria-label={`Decline connection from ${profile.user.name}`}>
                Decline
              </Button>
            </>
          )}
          {type === 'sent' && (
            <Button variant="outline" className="w-full min-h-[44px] text-muted-foreground hover:text-red-500 hover:border-red-500" onClick={() => onWithdraw(conn._id)} aria-label={`Withdraw connection request to ${profile.user.name}`}>
              <Trash2 className="h-4 w-4 mr-2" /> Withdraw Request
            </Button>
          )}
          {type === 'connected' && (
            <div className="flex w-full gap-2">
              <Button variant="default" className="flex-1 min-h-[44px]" onClick={() => onMessage && onMessage(conn._id, profile.user)} aria-label={`Message ${profile.user.name}`}>
                Message
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="More options">
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950" onClick={(e) => { e.stopPropagation(); onUnmatch(conn._id); }}>
                    <UserMinus className="h-4 w-4 mr-2" /> Unmatch
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setReportingUser({ id: profile.user._id, name: profile.user.name }); }}>
                    <Flag className="h-4 w-4 mr-2" /> Report {profile.user.name}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950" onClick={(e) => { e.stopPropagation(); handleBlock(profile.user._id, profile.user.name); }}>
                    <ShieldBan className="h-4 w-4 mr-2" /> Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardFooter>
      </Card>
      </li>
    );
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Received Requests */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Received Requests</h2>
          <Badge variant="secondary" className="text-sm">{receivedRequests.length}</Badge>
        </div>
        {receivedRequests.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-0">
            {receivedRequests.map(c => renderConnectionCard(c, 'received'))}
          </ul>
        ) : (
          <EmptyState 
            icon={UserPlus} 
            title="No received requests" 
            description="When someone wants to connect with you, it will appear here." 
          />
        )}
      </section>

      {/* Connected */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Your Roommates</h2>
          <Badge variant="secondary" className="text-sm">{connected.length}</Badge>
        </div>
        {connected.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-0">
            {connected.map(c => renderConnectionCard(c, 'connected'))}
          </ul>
        ) : (
          <EmptyState 
            icon={CheckCircle2} 
            title="No connections yet" 
            description="Accept connection requests or reach out to matches to build your network." 
          />
        )}
      </section>

      {/* Sent Requests */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Sent Requests</h2>
          <Badge variant="secondary" className="text-sm">{sentRequests.length}</Badge>
        </div>
        {sentRequests.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-0">
            {sentRequests.map(c => renderConnectionCard(c, 'sent'))}
          </ul>
        ) : (
          <EmptyState 
            icon={Clock} 
            title="No sent requests" 
            description="You haven't sent any connection requests yet." 
          />
        )}
      </section>
      
      {reportingUser && (
        <ReportUserModal 
          open={!!reportingUser} 
          onOpenChange={(open) => !open && setReportingUser(null)}
          targetUserId={reportingUser.id}
          targetUserName={reportingUser.name}
        />
      )}
    </div>
  );
};
