import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, MapPin, DollarSign, Heart, MessageSquare, Zap, Clock, Sparkles, Map, List, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { RoommateFilters, FilterState } from "@/components/roommates/RoommateFilters";
import { RoommateSuggestionsWidget } from "@/components/roommates/RoommateSuggestionsWidget";
import { RoommateGroupCreateModal } from "@/components/roommates/RoommateGroupCreateModal";
import { RoommateGroupManage } from "@/components/roommates/RoommateGroupManage";
import { RoommateGroupCard } from "@/components/roommates/RoommateGroupCard";
import { RoommateCard } from "@/components/roommates/RoommateCard";
import { RoommateMapView } from "@/components/roommates/RoommateMapView";

const RoommateFind = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [myProfile, setMyProfile] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<any[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  
  // Group states
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [discoverTab, setDiscoverTab] = useState<'individuals' | 'groups'>('individuals');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [requestLoading, setRequestLoading] = useState<string | null>(null);
  const [refreshSuggestionsTrigger, setRefreshSuggestionsTrigger] = useState(0);

  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    minBudget: "", maxBudget: "", moveInDate: "", cleanliness: "",
    sleepSchedule: "", smoking: "", pets: "", guestPolicy: "",
    cookingHabits: "", sharedSpaceExpectations: "", noiseTolerance: "",
    sortBy: "match_score_desc", search: "", verifiedOnly: "false", radius: "", lat: "", lng: ""
  });

  const fetchProfileAndMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const profileRes = await fetch(`${API_URL}/api/roommates/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setMyProfile(profileData);

        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value as string);
        });

        const [discoverRes, savedRes, connectionsRes, savedProfilesRes, groupsRes, myGroupsRes] = await Promise.all([
          fetch(`${API_URL}/api/roommates/discover?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/roommates/saved`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/roommates/connections`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/roommates/saved-profiles`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/roommates/groups/discover?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/roommates/groups/my-groups`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (discoverRes.ok) setMatches(await discoverRes.json());
        if (savedRes.ok) setSavedIds(new Set(await savedRes.json()));
        if (connectionsRes.ok) setConnections(await connectionsRes.json());
        if (savedProfilesRes.ok) setSavedProfiles(await savedProfilesRes.json());
        if (groupsRes.ok) setGroups(await groupsRes.json());
        if (myGroupsRes.ok) setMyGroups(await myGroupsRes.json());
        
        setRefreshSuggestionsTrigger(prev => prev + 1);
      } else {
        setMyProfile(null);
        setMatches([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndMatches();
  }, []);

  const handleJoinGroup = async (groupId: string) => {
    setRequestLoading(groupId);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/roommates/groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast({ title: "Request Sent", description: "The group admin will review your request." });
        fetchProfileAndMatches();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to send request", variant: "destructive" });
    } finally {
      setRequestLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Badge variant="accent" className="mb-4">
              <Home className="mr-1 h-3 w-3" /> Find Roommates & Groups
            </Badge>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Your Perfect Match</h1>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6 space-y-6">
            {myProfile && (myProfile.status === 'paused' || myProfile.visibility === 'hidden') && (
              <Alert className="bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4 stroke-current" />
                <AlertTitle>Profile Hidden</AlertTitle>
                <AlertDescription>Your profile is hidden from others.</AlertDescription>
              </Alert>
            )}

            {myProfile && !loading && (
              <RoommateSuggestionsWidget 
                refreshTrigger={refreshSuggestionsTrigger}
                onActionClick={(type) => {
                  if (type === 'discover_matches') setDiscoverTab('individuals');
                }}
              />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <RoommateFilters filters={filters} onFilterChange={setFilters} isLoading={loading} />
                <div className="flex bg-muted p-1 rounded-md shrink-0">
                  <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 px-3">
                    <List className="w-4 h-4 mr-2" /> List
                  </Button>
                  <Button variant={viewMode === 'map' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('map')} className="h-8 px-3">
                    <Map className="w-4 h-4 mr-2" /> Map
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 border-b border-border mb-4">
              <button 
                className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${discoverTab === 'individuals' ? 'border-primary text-primary' : 'border-transparent'}`}
                onClick={() => setDiscoverTab('individuals')}
              >Individuals</button>
              <button 
                className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${discoverTab === 'groups' ? 'border-primary text-primary' : 'border-transparent'}`}
                onClick={() => setDiscoverTab('groups')}
              >Groups</button>
            </div>

            {loading ? <div className="text-center py-20">Loading...</div> : discoverTab === 'individuals' ? (
              viewMode === 'map' ? (
                <RoommateMapView items={matches} center={filters.lat && filters.lng ? [parseFloat(filters.lat), parseFloat(filters.lng)] : [40.7128, -74.0060]} onViewProfile={setSelectedProfile} itemType="individual" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map(match => (
                    <RoommateCard 
                      key={match._id} profile={match} onView={() => setSelectedProfile(match)}
                      isSaved={savedIds.has(match._id)} onSave={() => {}} onConnect={() => {}} connectionStatus={null}
                    />
                  ))}
                </div>
              )
            ) : (
              viewMode === 'map' ? (
                <RoommateMapView items={groups} center={filters.lat && filters.lng ? [parseFloat(filters.lat), parseFloat(filters.lng)] : [40.7128, -74.0060]} onViewProfile={setSelectedGroup} itemType="group" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map(group => (
                    <RoommateGroupCard 
                      key={group._id} group={group} onView={() => setSelectedGroup(group)} onJoin={() => handleJoinGroup(group._id)}
                      myProfileId={myProfile?.user._id} isMember={group.members.some((m:any) => m._id === myProfile?.user._id)}
                      isPending={group.pendingRequests.some((m:any) => m._id === myProfile?.user._id)} loading={requestLoading === group._id}
                    />
                  ))}
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <h2 className="text-xl font-bold mb-4">Your Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myGroups.map(group => (
                <RoommateGroupManage key={group._id} group={group} onUpdate={fetchProfileAndMatches} myUserId={myProfile?.user._id} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {savedProfiles.map(match => (
                 <RoommateCard key={match._id} profile={match} onView={() => setSelectedProfile(match)} isSaved={true} onSave={() => {}} onConnect={() => {}} connectionStatus={null} />
               ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <RoommateGroupCreateModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onGroupCreated={fetchProfileAndMatches} />
    </div>
  );
};

export default RoommateFind;
