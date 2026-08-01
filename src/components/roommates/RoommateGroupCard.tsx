import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { RoommateVerificationBadge } from './RoommateVerificationBadge';

interface GroupData {
  _id: string;
  name: string;
  description: string;
  targetSize: number;
  members: any[];
  admin: any;
  preferredLocations?: string[];
  budgetRange?: { min: number; max: number };
  moveInDate?: string;
  status: string;
  compatibilityScore?: number;
  pendingRequests?: any[];
}

interface RoommateGroupCardProps {
  group: GroupData;
  onJoinRequest?: (id: string) => void;
  onRequestLoading?: boolean;
  onOpenChat?: (id: string, groupName: string) => void;
  myUserId?: string;
}

export const RoommateGroupCard: React.FC<RoommateGroupCardProps> = ({
  group,
  onJoinRequest,
  onRequestLoading,
  onOpenChat,
  myUserId
}) => {
  const isMember = group.members.some(m => m._id === myUserId || m === myUserId);
  const isPending = group.pendingRequests?.some(p => p._id === myUserId || p === myUserId);
  const isAdmin = group.admin._id === myUserId || group.admin === myUserId;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50 group bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b bg-secondary/10 relative">
        {group.compatibilityScore !== undefined && group.compatibilityScore > 0 && !isMember && (
          <div className="absolute top-3 right-3 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full border border-primary/20">
            {group.compatibilityScore}% Match
          </div>
        )}
        <CardTitle className="text-xl pr-16">{group.name}</CardTitle>
        <div className="flex gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
          <Badge variant="secondary" className="flex gap-1 items-center font-normal">
            <Users className="w-3 h-3" />
            {group.members.length} / {group.targetSize} Members
          </Badge>
          {group.status === 'closed' && (
            <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20">Closed</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 flex-1 flex flex-col gap-4">
        <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
          {group.description}
        </p>
        
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mt-auto">
          {group.budgetRange && group.budgetRange.max > 0 && (
            <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>${group.budgetRange.min} - ${group.budgetRange.max}</span>
            </div>
          )}
          {group.preferredLocations && group.preferredLocations.length > 0 && (
            <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate">{group.preferredLocations[0]} {group.preferredLocations.length > 1 && `+${group.preferredLocations.length - 1}`}</span>
            </div>
          )}
          {group.moveInDate && (
            <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md col-span-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Target: {new Date(group.moveInDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Members</p>
          <div className="flex -space-x-2 overflow-hidden">
            {group.members.slice(0, 5).map((m, i) => (
              <Avatar key={m._id || i} className="inline-block border-2 border-background w-8 h-8">
                <AvatarImage src={m.profilePicture || m.avatar_url} />
                <AvatarFallback className="text-[10px]">{m.name?.substring(0, 2) || m.full_name?.substring(0, 2) || '?'}</AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 5 && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-secondary text-[10px] font-medium text-muted-foreground z-10">
                +{group.members.length - 5}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t bg-secondary/5 mt-auto flex flex-col gap-2">
        {isMember ? (
          <div className="flex flex-col w-full gap-2">
            <Badge className="w-full justify-center py-1.5" variant="secondary">You are a member</Badge>
            {onOpenChat && (
              <Button className="w-full" variant="default" onClick={() => onOpenChat(group._id, group.name)}>
                <MessageSquare className="w-4 h-4 mr-2" /> Open Group Chat
              </Button>
            )}
          </div>
        ) : isPending ? (
          <Button className="w-full" variant="outline" disabled>
            Request Pending...
          </Button>
        ) : (
          group.status === 'open' && group.members.length < group.targetSize && onJoinRequest && (
            <Button 
              className="w-full" 
              onClick={() => onJoinRequest(group._id)}
              disabled={onRequestLoading}
            >
              Request to Join
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
};
