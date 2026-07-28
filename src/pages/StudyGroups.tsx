import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Users, Lock, Globe, Plus, Search, Sparkles } from 'lucide-react';
import { useStudyGroups, StudyGroup } from '@/hooks/useStudyGroups';
import { useAuth } from '@/hooks/useAuth';
import { SyncStatusIndicator } from '@/components/dashboard/SyncStatusIndicator';

const StudyGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    myGroups, 
    discoverGroups, 
    loadingMyGroups, 
    loadingDiscover, 
    searchQuery, 
    setSearchQuery, 
    status, 
    createGroup, 
    joinGroup 
  } = useStudyGroups();
  
  const [activeTab, setActiveTab] = useState('my-groups');
  
  // Filtering & Sorting State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('most_active');
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public' as 'public' | 'private',
    member_limit: 50
  });

  // Derive unique categories for dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set(discoverGroups.map(g => g.category));
    return Array.from(cats).sort();
  }, [discoverGroups]);

  const recommendedGroups = useMemo(() => {
    if (!discoverGroups || discoverGroups.length === 0) return [];
    // @ts-ignore - Assuming interestTags exists on user
    const userInterests = user?.interestTags || [];
    
    let scored = discoverGroups.map(g => {
      let score = 0;
      if (userInterests.some((i: string) => g.category.toLowerCase().includes(i.toLowerCase()))) score += 10;
      if (g.last_activity) {
        const days = (new Date().getTime() - new Date(g.last_activity).getTime()) / (1000 * 3600 * 24);
        if (days <= 7) score += 5;
      }
      return { ...g, score };
    });
    
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [discoverGroups, user]);

  const filteredDiscoverGroups = useMemo(() => {
    let result = [...discoverGroups];
    
    if (filterCategory !== 'all') {
      result = result.filter(g => g.category === filterCategory);
    }
    
    if (filterActivity === 'active_week') {
      result = result.filter(g => {
        if (!g.last_activity) return false;
        return (new Date().getTime() - new Date(g.last_activity).getTime()) / (1000 * 3600 * 24) <= 7;
      });
    } else if (filterActivity === 'active_month') {
      result = result.filter(g => {
        if (!g.last_activity) return false;
        return (new Date().getTime() - new Date(g.last_activity).getTime()) / (1000 * 3600 * 24) <= 30;
      });
    }
    
    if (sortBy === 'most_members') {
      result.sort((a, b) => b.member_count - a.member_count);
    } else if (sortBy === 'most_active') {
      result.sort((a, b) => {
        const aDate = a.last_activity ? new Date(a.last_activity).getTime() : 0;
        const bDate = b.last_activity ? new Date(b.last_activity).getTime() : 0;
        return bDate - aDate;
      });
    } else if (sortBy === 'newest') {
      result.sort((a, b) => {
        const aId = a._id.toString();
        const bId = b._id.toString();
        return bId.localeCompare(aId);
      });
    } else if (sortBy === 'best_match') {
      // @ts-ignore
      const userInterests = user?.interestTags || [];
      result.sort((a, b) => {
        const aMatch = userInterests.some((i: string) => a.category.toLowerCase().includes(i.toLowerCase())) ? 1 : 0;
        const bMatch = userInterests.some((i: string) => b.category.toLowerCase().includes(i.toLowerCase())) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        const aDate = a.last_activity ? new Date(a.last_activity).getTime() : 0;
        const bDate = b.last_activity ? new Date(b.last_activity).getTime() : 0;
        return bDate - aDate;
      });
    }
    
    return result;
  }, [discoverGroups, filterCategory, filterActivity, sortBy, user]);

  const handleCreateSubmit = async () => {
    if (!formData.name || !formData.description || !formData.category) return;
    
    try {
      await createGroup(formData);
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', category: '', privacy: 'public', member_limit: 50 });
      // Switch to 'my-groups' tab so they see their new group immediately
      setActiveTab('my-groups');
    } catch (e) {
      // Error handled by hook toast, keep modal open
    }
  };



  const renderGroupCard = (group: StudyGroup, isMember: boolean) => {
    let isActive = false;
    if (group.last_activity) {
      isActive = (new Date().getTime() - new Date(group.last_activity).getTime()) / (1000 * 3600 * 24) <= 7;
    }
    
    return (
    <Card key={group._id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={group.privacy === 'public' ? 'secondary' : 'outline'}>
              {group.privacy === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
              {group.privacy}
            </Badge>
            {isActive && <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>}
          </div>
          <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap ml-2">
            <Users className="w-4 h-4 mr-1" />
            {group.member_count} / {group.member_limit}
          </div>
        </div>
        <h3 className="text-xl font-bold line-clamp-1">{group.name}</h3>
        <Badge variant="outline" className="w-fit mt-1">{group.category}</Badge>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">{group.description}</p>
      </CardContent>
      
      <CardFooter>
        {isMember ? (
          <Button className="w-full" variant="secondary" onClick={() => navigate(`/placement/study-groups/${group._id}`)}>
            View Group
          </Button>
        ) : (
          <Button 
            className="w-full" 
            variant="default"
            disabled={group.member_count >= group.member_limit}
            onClick={() => joinGroup(group._id)}
          >
            {group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Peer Study Groups</h1>
            <p className="text-muted-foreground mt-1">Connect with peers, share resources, and study together.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <SyncStatusIndicator status={status} />
            
            {user && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Create Group</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Study Group</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Group Name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. Amazon SDE Prep Fall 2026" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="What is this group about?" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Focus Area (Subject)</Label>
                      <Input 
                        id="category" 
                        placeholder="e.g. Data Structures, React, System Design" 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Privacy</Label>
                        <Select 
                          value={formData.privacy} 
                          onValueChange={(val: 'public'|'private') => setFormData({...formData, privacy: val})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private (Invite/Request)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="limit">Member Limit</Label>
                        <Input 
                          id="limit" 
                          type="number" 
                          min={2} 
                          max={200}
                          value={formData.member_limit}
                          onChange={e => setFormData({...formData, member_limit: parseInt(e.target.value) || 50})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleCreateSubmit}
                      disabled={!formData.name || !formData.description || !formData.category}
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="min-h-[400px]">
            {loadingMyGroups ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : myGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 border rounded-lg bg-muted/10 border-dashed">
                <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">You haven't joined any groups yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Join a study group to collaborate with peers, share resources, and track progress together.
                </p>
                <Button onClick={() => setActiveTab('discover')}>Discover groups to join</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map(g => renderGroupCard(g, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="min-h-[400px]">
            {/* Filter and Sort Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-muted/30 rounded-lg border">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by group name or focus area..." 
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {uniqueCategories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterActivity} onValueChange={setFilterActivity}>
                  <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue placeholder="Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Activity</SelectItem>
                    <SelectItem value="active_week">Active this week</SelectItem>
                    <SelectItem value="active_month">Active this month</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="most_active">Most Active</SelectItem>
                    <SelectItem value="best_match">Best Match</SelectItem>
                    <SelectItem value="most_members">Most Members</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingDiscover ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : discoverGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 border rounded-lg bg-muted/10 border-dashed">
                <Globe className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">No groups found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "We couldn't find any groups matching your search." : "There are no public groups available to join right now."}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                )}
              </div>
            ) : (
              <>
                {/* Recommended Section (Only show if not strictly filtering) */}
                {!searchQuery && filterCategory === 'all' && filterActivity === 'all' && recommendedGroups.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Recommended for You
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendedGroups.map(g => renderGroupCard(g, false))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">All Groups</h2>
                  {filteredDiscoverGroups.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                      No groups match your active filters.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredDiscoverGroups.map(g => renderGroupCard(g, false))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default StudyGroups;
