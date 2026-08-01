import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, DollarSign, Calendar, Sparkles, Clock, Cigarette, Dog, Heart, MessageSquare, UserPlus, Info, UserMinus, MoreVertical, Flag, ShieldBan } from "lucide-react";
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
import { RoommateMatch } from "@/pages/RoommateFind";
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

interface RoommateDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: RoommateMatch | null;
  savedIds: Set<string>;
  connections: any[];
  myProfile: any;
  onSaveToggle: (profileId: string) => void;
  onConnect: (recipientId: string) => void;
  onRespond: (connectionId: string, status: 'Accepted' | 'Declined') => void;
  onUnmatch: (connectionId: string) => void;
  onMessage?: (connectionId: string, otherUser: any) => void;
}

export const RoommateDetailSheet: React.FC<RoommateDetailSheetProps> = ({
  open,
  onOpenChange,
  profile,
  savedIds,
  connections,
  myProfile,
  onSaveToggle,
  onConnect,
  onRespond,
  onUnmatch,
  onMessage
}) => {
  const { toast } = useToast();
  const [reportingUser, setReportingUser] = React.useState<{id: string, name: string} | null>(null);

  if (!profile) return null;

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

  const renderConnectionAction = () => {
    if (!myProfile || !myProfile.user) return null;
    const myUserId = myProfile.user._id;
    const targetUserId = profile.user._id;
    
    const conn = connections.find(c => 
      (c.requester._id === myUserId && c.recipient._id === targetUserId) ||
      (c.recipient._id === myUserId && c.requester._id === targetUserId)
    );

    if (!conn) {
      return (
        <Button className="flex-1 gap-2 min-h-[44px]" onClick={() => onConnect(targetUserId)} aria-label={`Connect with ${profile.user.name}`}>
          <MessageSquare className="h-4 w-4" /> Connect
        </Button>
      );
    }

    if (conn.status === 'Accepted') {
      return (
        <div className="flex w-full gap-2">
          <Button variant="default" className="flex-1 gap-2 min-h-[44px]" onClick={() => onMessage && onMessage(conn._id, profile.user)} aria-label={`Message ${profile.user.name}`}>
            <MessageSquare className="h-4 w-4" /> Message
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
      );
    }

    if (conn.status === 'Pending') {
      if (conn.requester._id === myUserId) {
        return (
          <Button variant="secondary" className="flex-1 gap-2 min-h-[44px]" disabled aria-label="Connection request sent">
            <Clock className="h-4 w-4" /> Request Sent
          </Button>
        );
      } else {
        return (
          <div className="flex gap-2 flex-1">
            <Button variant="default" className="flex-1 min-h-[44px]" onClick={() => onRespond(conn._id, 'Accepted')} aria-label={`Accept connection from ${profile.user.name}`}>
              Accept
            </Button>
            <Button variant="destructive" className="flex-1 min-h-[44px]" onClick={() => onRespond(conn._id, 'Declined')} aria-label={`Decline connection from ${profile.user.name}`}>
              Decline
            </Button>
          </div>
        );
      }
    }

    if (conn.status === 'Declined') {
      return (
        <Button variant="outline" className="flex-1 gap-2 min-h-[44px]" disabled>
          Declined
        </Button>
      );
    }
  };

  const isSaved = savedIds.has(profile._id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full bg-background border-l border-border/50">
        <ScrollArea className="flex-1 pb-24">
          
          {/* Gallery / Cover Image */}
          <div className="relative w-full h-64 bg-secondary">
            {profile.galleryPhotos && profile.galleryPhotos.length > 0 ? (
              <div className="flex overflow-x-auto snap-x snap-mandatory h-full">
                {profile.galleryPhotos.map((photo, idx) => (
                  <img key={idx} src={photo} alt="Gallery" className="h-full min-w-full object-cover snap-center" />
                ))}
              </div>
            ) : profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-muted">
                <Info className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>

          <div className="px-6 relative -mt-16 z-10 pb-6">
            <div className="flex justify-between items-end mb-4">
              <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                {profile.profilePhoto ? (
                  <AvatarImage src={profile.profilePhoto} alt={profile.user.name} className="object-cover" />
                ) : profile.user.profilePicture ? (
                  <AvatarImage src={profile.user.profilePicture} alt={profile.user.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {profile.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Badge variant={profile.compatibilityScore >= 80 ? "default" : "secondary"} className="text-lg px-3 py-1 shadow-md mb-2">
                {profile.compatibilityScore}% Match
              </Badge>
            </div>

            <SheetHeader className="text-left mb-6">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-3xl font-bold">{profile.user.name}</SheetTitle>
                <RoommateVerificationBadge status={profile.verificationStatus} iconSize={24} />
              </div>
              {profile.bio && (
                <SheetDescription className="text-base text-foreground mt-2 italic">
                  "{profile.bio}"
                </SheetDescription>
              )}
            </SheetHeader>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-secondary/20 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <DollarSign className="h-5 w-5" aria-hidden="true" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Budget</span>
                </div>
                <p className="text-lg font-medium">${profile.budgetRange.min} - ${profile.budgetRange.max}</p>
              </div>
              <div className="bg-secondary/20 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Move-in</span>
                </div>
                <p className="text-lg font-medium">{new Date(profile.moveInDate).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2 bg-secondary/20 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Preferred Locations</span>
                </div>
                <p className="text-base font-medium">
                  {profile.preferredLocations && profile.preferredLocations.length > 0 
                    ? profile.preferredLocations.join(", ") 
                    : "Open to anywhere"}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="text-lg font-semibold mb-4">Lifestyle & Preferences</h3>
            <ul className="flex flex-wrap gap-3 mb-8 p-0 list-none">
              <li>
                <Badge variant="outline" className="text-sm py-1.5 px-3 bg-secondary/10">
                  <Sparkles className="w-4 h-4 mr-2 text-blue-500" /> 
                  Cleanliness: <span className="ml-1 font-semibold text-foreground">{profile.lifestyle_preferences.cleanliness}</span>
                </Badge>
              </li>
              <li>
                <Badge variant="outline" className="text-sm py-1.5 px-3 bg-secondary/10">
                  <Clock className="w-4 h-4 mr-2 text-yellow-500" /> 
                  Sleep: <span className="ml-1 font-semibold text-foreground">{profile.lifestyle_preferences.sleepSchedule}</span>
                </Badge>
              </li>
              <li>
                <Badge variant="outline" className="text-sm py-1.5 px-3 bg-secondary/10">
                  <Cigarette className="w-4 h-4 mr-2 text-slate-500" /> 
                  Smoking: <span className="ml-1 font-semibold text-foreground">{profile.lifestyle_preferences.smoking}</span>
                </Badge>
              </li>
              <li>
                <Badge variant="outline" className="text-sm py-1.5 px-3 bg-secondary/10">
                  <Dog className="w-4 h-4 mr-2 text-green-500" /> 
                  Pets: <span className="ml-1 font-semibold text-foreground">{profile.lifestyle_preferences.pets}</span>
                </Badge>
              </li>
            </ul>

            <Separator className="my-6" />

            <h3 className="text-lg font-semibold mb-4">Compatibility Breakdown</h3>
            {profile.compatibilityBreakdown ? (
              <ul className="space-y-4 p-0 list-none">
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium">Budget Match</span>
                  <span className="text-sm font-bold">{profile.compatibilityBreakdown.budget} / 20 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium">Location Match</span>
                  <span className="text-sm font-bold">{profile.compatibilityBreakdown.location} / 20 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cleanliness</span>
                  <span className="text-sm font-bold">{profile.compatibilityBreakdown.cleanliness} / 10 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sleep Schedule</span>
                  <span className="text-sm font-bold">{profile.compatibilityBreakdown.sleep} / 10 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium">Smoking & Pets</span>
                  <span className="text-sm font-bold">{profile.compatibilityBreakdown.lifestyle} / 10 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm font-medium">Advanced Lifestyle</span>
                  <span className="text-sm font-bold">{profile.compatibilityBreakdown.advancedLifestyle || 0} / 30 pts</span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Breakdown not available.</p>
            )}

          </div>
        </ScrollArea>

        {/* Fixed Footer for Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50 flex gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
          <Button 
            variant="outline" 
            aria-label={isSaved ? `Unsave ${profile.user.name}'s profile` : `Save ${profile.user.name}'s profile`}
            className={`flex-1 gap-2 group min-h-[44px] ${isSaved ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20' : 'hover:border-red-500 hover:text-red-500'}`}
            onClick={() => onSaveToggle(profile._id)}
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : 'group-hover:fill-current'}`} /> 
            {isSaved ? 'Saved' : 'Save Profile'}
          </Button>
          
          {renderConnectionAction()}
        </div>
      </SheetContent>
      {reportingUser && (
        <ReportUserModal 
          open={!!reportingUser} 
          onOpenChange={(open) => !open && setReportingUser(null)}
          targetUserId={reportingUser.id}
          targetUserName={reportingUser.name}
        />
      )}
    </Sheet>
  );
};
