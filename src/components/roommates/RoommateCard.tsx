import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, MessageSquare } from "lucide-react";
import { RoommateVerificationBadge } from "./RoommateVerificationBadge";

interface RoommateCardProps {
  profile: any;
  onView: () => void;
  isSaved: boolean;
  onSave: () => void;
  onConnect: () => void;
  connectionStatus: any;
}

export const RoommateCard: React.FC<RoommateCardProps> = ({ profile, onView, isSaved, onSave, onConnect, connectionStatus }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="p-0">
        <div className="h-24 bg-muted relative">
          <div className="absolute -bottom-8 left-4">
            <Avatar className="h-16 w-16 border-4 border-background">
              <AvatarImage src={profile.user.avatar_url || profile.user.profilePicture} />
              <AvatarFallback>{profile.user.name?.[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute top-2 right-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 hover:bg-background/80 rounded-full backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onSave(); }}>
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
            </Button>
          </div>
        </div>
        <div className="pt-10 pb-4 px-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-1">
                {profile.user.name || profile.user.full_name}
                <RoommateVerificationBadge status={profile.verificationStatus} />
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{profile.bio || 'No bio provided'}</p>
            </div>
            {profile.compatibilityScore && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {profile.compatibilityScore}% Match
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">${profile.budgetRange?.max || 0}/mo</Badge>
            {profile.preferredLocations?.[0] && <Badge variant="outline">{profile.preferredLocations[0]}</Badge>}
          </div>

          <div className="mt-4 flex gap-2">
            <Button className="flex-1" variant={connectionStatus ? "secondary" : "default"} onClick={(e) => { e.stopPropagation(); if (!connectionStatus) onConnect(); }}>
              {connectionStatus === 'Pending' ? 'Requested' : connectionStatus === 'Accepted' ? 'Connected' : <><UserPlus className="w-4 h-4 mr-2" /> Connect</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
