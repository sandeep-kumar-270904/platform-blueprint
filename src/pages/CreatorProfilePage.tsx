import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreatorProfile, useFollowCreator, useMuteCreator } from '../hooks/useCreators';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, UserPlus, UserMinus, BellOff, BellRing, Users, Eye, Heart, FileText } from 'lucide-react';
import { CreatorCard } from '../components/creators/CreatorCard';
import { CreatorDetailModal } from '../components/creators/CreatorDetailModal';

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useCreatorProfile(id || null);
  const followMutation = useFollowCreator();
  const muteMutation = useMuteCreator();

  const [selectedItem, setSelectedItem] = React.useState<any>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
        <Button variant="ghost" disabled className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="space-y-4 flex-1 text-center md:text-left">
            <Skeleton className="h-10 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-6 w-72 mx-auto md:mx-0" />
            <div className="flex gap-4 justify-center md:justify-start">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-4">Creator Not Found</h2>
        <p className="text-muted-foreground mb-6">This profile might have been removed or is unavailable.</p>
        <Button onClick={() => navigate('/creators')}>Return to Creators Zone</Button>
      </div>
    );
  }

  const { creator, stats, content } = data;

  const handleFollow = () => {
    if (id) followMutation.mutate(id);
  };

  const handleMute = () => {
    if (id) muteMutation.mutate(id);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 -ml-4 hover:bg-transparent hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
        <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl ring-2 ring-primary/20">
          <AvatarImage src={creator.avatar || ''} alt={creator.name} />
          <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
            {creator.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{creator.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              {creator.bio || "This creator hasn't added a bio yet."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
            <Badge variant="secondary" className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-primary" />
              {creator.followersCount.toLocaleString()} Followers
            </Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{creator.followingCount.toLocaleString()} Following</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
            <Button 
              onClick={handleFollow} 
              variant={creator.isFollowing ? "outline" : "default"}
              className={`rounded-full px-6 min-h-[44px] ${creator.isFollowing ? 'hover:text-destructive hover:border-destructive hover:bg-destructive/10' : 'shadow-md'}`}
              disabled={followMutation.isPending}
            >
              {followMutation.isPending ? 'Updating...' : creator.isFollowing ? (
                <><UserMinus className="w-4 h-4 mr-2" /> Unfollow</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Follow</>
              )}
            </Button>

            {creator.isFollowing && (
              <Button 
                onClick={handleMute}
                variant="ghost"
                size="icon"
                title={creator.isMuted ? "Unmute Notifications" : "Mute Notifications"}
                className={`rounded-full min-h-[44px] min-w-[44px] ${creator.isMuted ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'}`}
                disabled={muteMutation.isPending}
              >
                {creator.isMuted ? <BellOff className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary"><FileText className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground font-medium">Published Content</div>
              <div className="text-2xl font-bold">{stats.totalContent.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Eye className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground font-medium">Total Views</div>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><Heart className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-muted-foreground font-medium">Total Likes</div>
              <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="pt-6 border-t border-border/40">
        <h2 className="text-2xl font-bold mb-6">Recent Content</h2>
        
        {content.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-2xl border border-border/50 border-dashed">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No content yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              {creator.name} hasn't published any content.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item) => (
              <CreatorCard 
                key={item._id} 
                item={item} 
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <CreatorDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
}
