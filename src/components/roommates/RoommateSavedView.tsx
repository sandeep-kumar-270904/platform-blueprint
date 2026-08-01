import React, { useState, useMemo } from "react";
import { RoommateMatch } from "@/pages/RoommateFind";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, DollarSign, Clock, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoommateVerificationBadge } from "@/components/roommates/RoommateVerificationBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

interface RoommateSavedViewProps {
  savedProfiles: RoommateMatch[];
  connections: any[];
  savedIds: Set<string>;
  onSaveToggle: (profileId: string) => void;
  onProfileSelect: (profile: RoommateMatch) => void;
  onConnect: (recipientId: string) => void;
  onRespond: (connectionId: string, status: 'Accepted' | 'Declined') => void;
  onMessage?: (connectionId: string, otherUser: any) => void;
}

export const RoommateSavedView: React.FC<RoommateSavedViewProps> = ({
  savedProfiles,
  connections,
  savedIds,
  onSaveToggle,
  onProfileSelect,
  onConnect,
  onRespond,
  onMessage
}) => {
  const [sortBy, setSortBy] = useState("recent");

  const sortedProfiles = useMemo(() => {
    const list = [...savedProfiles];
    if (sortBy === "compatibility") {
      list.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
    } else if (sortBy === "budget_asc") {
      list.sort((a, b) => (a.budgetRange?.max || 0) - (b.budgetRange?.max || 0));
    }
    // "recent" doesn't need sorting if we assume the array is returned in order or we don't have save timestamps, 
    // but typically we'd reverse it or leave it as returned by DB. Let's just reverse to show latest at top conceptually if array order is stable.
    return list;
  }, [savedProfiles, sortBy]);

  const renderConnectionAction = (targetUserId: string, targetName: string) => {
    // Check connections list
    const conn = connections.find(c => 
      (c.requester._id === targetUserId || c.recipient._id === targetUserId) &&
      (c.status === 'Pending' || c.status === 'Accepted')
    );

    if (!conn) {
      return (
        <Button 
          className="flex-1 gap-2 min-h-[44px]" 
          onClick={(e) => { e.stopPropagation(); onConnect(targetUserId); }}
          aria-label={`Connect with ${targetName}`}
        >
          Connect
        </Button>
      );
    }

    if (conn.status === 'Accepted') {
      return (
        <Button 
          variant="secondary" 
          className="flex-1 gap-2 min-h-[44px]"
          onClick={(e) => { e.stopPropagation(); onMessage && onMessage(conn._id, conn.requester._id === targetUserId ? conn.requester : conn.recipient); }}
          aria-label={`Message ${targetName}`}
        >
          Message
        </Button>
      );
    }

    if (conn.status === 'Pending') {
      if (conn.recipient._id === targetUserId) {
        return (
          <Button variant="secondary" disabled className="flex-1 min-h-[44px] opacity-70">
            Pending
          </Button>
        );
      } else {
        return (
          <div className="flex gap-1 flex-1">
            <Button variant="default" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onRespond(conn._id, 'Accepted'); }}>
              Accept
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onRespond(conn._id, 'Declined'); }}>
              Decline
            </Button>
          </div>
        );
      }
    }
  };

  if (savedProfiles.length === 0) {
    return (
      <EmptyState 
        icon={Heart} 
        title="No saved profiles yet" 
        description="Browse matches and click the Save button to keep track of profiles you're interested in." 
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          Saved Profiles
          <Badge variant="secondary" className="ml-2 text-sm">{savedProfiles.length}</Badge>
        </h2>
        
        <div className="w-48">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Saved</SelectItem>
              <SelectItem value="compatibility">Highest Match</SelectItem>
              <SelectItem value="budget_asc">Lowest Budget</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProfiles.map((profile, idx) => {
          if (!profile || !profile.user) return null;
          
          return (
          <ScrollReveal key={profile._id} delay={idx * 0.05}>
            <Card 
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-background/50 backdrop-blur-sm flex flex-col group h-full cursor-pointer hover:-translate-y-1"
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
              <CardHeader className="pb-4 relative">
                {profile.profilePhoto && (
                  <div className="absolute top-0 left-0 right-0 h-20 bg-secondary/30 opacity-40 overflow-hidden z-0">
                    <img src={profile.profilePhoto} alt="Cover" className="w-full h-full object-cover blur-sm" />
                  </div>
                )}
                <div className="flex items-end gap-4 relative z-10 pt-4">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                    {profile.profilePhoto ? (
                      <AvatarImage src={profile.profilePhoto} alt={profile.user.name} className="object-cover" />
                    ) : profile.user.profilePicture ? (
                      <AvatarImage src={profile.user.profilePicture} alt={profile.user.name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {profile.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 pb-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold line-clamp-1 hover:text-primary transition-colors">{profile.user.name}</h3>
                        <RoommateVerificationBadge status={profile.verificationStatus} />
                      </div>
                    </div>
                    <Badge variant={profile.compatibilityScore >= 80 ? "default" : "secondary"} className="mt-1 shadow-sm">
                      {profile.compatibilityScore}% Match
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground bg-secondary/20 p-2 rounded-md">
                    <DollarSign className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-medium">${profile.budgetRange?.max}/mo</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground bg-secondary/20 p-2 rounded-md">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-medium">
                      {profile.preferredLocations && profile.preferredLocations.length > 0 
                        ? profile.preferredLocations[0] 
                        : "Open"}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t bg-secondary/10 flex gap-3 mt-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  aria-label={`Unsave ${profile.user.name}'s profile`}
                  className="flex-1 gap-1 group min-h-[44px] border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20"
                  onClick={(e) => { e.stopPropagation(); onSaveToggle(profile._id); }}
                >
                  <Heart className="h-4 w-4 fill-current" /> 
                  Saved
                </Button>
                {renderConnectionAction(profile.user._id, profile.user.name)}
              </CardFooter>
            </Card>
          </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
};
