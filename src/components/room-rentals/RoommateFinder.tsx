import React, { useState } from 'react';
import { useRoommates, RoommateProfile } from '@/hooks/useRoommates';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, Sparkles, CheckCircle2, User, Moon, VolumeX, Cigarette, Dog, DollarSign, Calendar } from 'lucide-react';

export const RoommateFinder = () => {
  const { discoverRoommates, sendConnection, myProfile } = useRoommates();
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  if (myProfile.isLoading) return <div className="text-center py-8">Loading...</div>;

  if (!myProfile.data) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
        <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Create Your Profile First</h3>
        <p className="text-muted-foreground mb-6">You need to set up your own roommate profile before you can discover others.</p>
        <p className="text-sm text-muted-foreground">Go to the "My Roommate Profile" tab to get started.</p>
      </div>
    );
  }

  if (discoverRoommates.isLoading) return <div className="text-center py-8">Finding matches...</div>;
  
  const profiles = discoverRoommates.data || [];

  if (profiles.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No matches found</h3>
        <p className="text-muted-foreground">Check back later for new potential roommates.</p>
      </div>
    );
  }

  const handleConnect = (id: string) => {
    sendConnection.mutate(id, {
      onSuccess: () => {
        setRequestedIds(prev => new Set(prev).add(id));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Discover Roommates</h2>
        <p className="text-muted-foreground">Sorted by compatibility score based on your profile preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <Card key={profile._id} className="relative overflow-hidden group">
            {profile.compatibilityScore && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg font-semibold text-sm shadow-sm flex items-center gap-1 z-10">
                <Sparkles className="w-3 h-3" />
                {Math.round(profile.compatibilityScore)}% Match
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                {profile.user.profilePicture ? (
                  <img src={profile.user.profilePicture} alt="User" className="w-16 h-16 rounded-full object-cover border-2 border-muted" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
                    {profile.user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{profile.user.name.split(' ')[0]}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Move-in: {new Date(profile.moveInDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Budget:</span> 
                ${profile.budgetRange.min} - ${profile.budgetRange.max}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1"><User className="w-3 h-3"/> {profile.cleanliness}</Badge>
                <Badge variant="secondary" className="flex items-center gap-1"><Moon className="w-3 h-3"/> {profile.sleepSchedule}</Badge>
                <Badge variant="secondary" className="flex items-center gap-1"><VolumeX className="w-3 h-3"/> {profile.noiseTolerance} Noise</Badge>
                <Badge variant="outline" className="flex items-center gap-1"><Cigarette className="w-3 h-3"/> {profile.smoking} Smoking</Badge>
                <Badge variant="outline" className="flex items-center gap-1"><Dog className="w-3 h-3"/> {profile.pets} Pets</Badge>
              </div>

              {profile.bio && (
                <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground line-clamp-3">
                  "{profile.bio}"
                </div>
              )}

              <Button 
                className="w-full mt-2" 
                variant={requestedIds.has(profile.user._id) ? "secondary" : "default"}
                disabled={requestedIds.has(profile.user._id) || sendConnection.isPending}
                onClick={() => handleConnect(profile.user._id)}
              >
                {requestedIds.has(profile.user._id) ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Request Sent</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Connect</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
