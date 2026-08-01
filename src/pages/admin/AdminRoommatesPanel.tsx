import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, Ban, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminRoommatesPanel() {
  const [stats, setStats] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchProfiles();
    fetchConnections();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/roommates/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await axios.get('/api/admin/roommates/profiles');
      setProfiles(res.data.profiles);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get('/api/admin/roommates/connections');
      setConnections(res.data.connections);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDeactivate = async (profileId: string) => {
    const reason = prompt("Enter a reason for deactivating this roommate profile (this will be sent to the user):");
    if (!reason) return;

    try {
      await axios.put(`/api/admin/roommates/profiles/${profileId}/deactivate`, { reason });
      alert("Profile deactivated successfully.");
      fetchProfiles();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate profile.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Roommate Admin...</div>;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Roommate Finder Moderation</h1>
        <p className="text-muted-foreground mt-2">Manage roommate profiles, monitor connection activity, and enforce community guidelines.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProfiles || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.newProfiles || 0} this week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeProfiles || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hidden / Paused</CardTitle>
                <Ban className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.hiddenProfiles || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
                <Activity className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalConnections || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.acceptedConnections || 0} Accepted, {stats?.pendingConnections || 0} Pending
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Roommate Profiles ({profiles.length})</CardTitle>
              <CardDescription>View and moderate user profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map(profile => (
                  <Card key={profile._id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b bg-secondary/10 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img 
                          src={profile.profilePhoto || profile.user?.avatar_url || 'https://via.placeholder.com/150'} 
                          alt="Profile" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{profile.user?.name || profile.user?.full_name || 'Unknown User'}</h3>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-4">
                              {profile.status}
                            </Badge>
                            <Badge variant={profile.visibility === 'everyone' ? 'outline' : 'secondary'} className="text-[10px] h-4">
                              {profile.visibility}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 text-sm space-y-3">
                      <div>
                        <span className="font-medium">Bio: </span>
                        <span className="text-muted-foreground line-clamp-3">{profile.bio || 'No bio'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Budget: </span>
                        <span className="text-muted-foreground">${profile.budgetRange?.min} - ${profile.budgetRange?.max}</span>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full mt-2" 
                        onClick={() => handleDeactivate(profile._id)}
                        disabled={profile.status === 'paused' && profile.visibility === 'hidden'}
                      >
                        Deactivate Profile
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>Recent Connections</CardTitle>
              <CardDescription>View roommate requests and matches between users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-max">
                  <thead className="bg-secondary/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Requester</th>
                      <th className="px-4 py-3 font-medium">Recipient</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map(conn => (
                      <tr key={conn._id} className="border-b last:border-0 hover:bg-secondary/10">
                        <td className="px-4 py-3 font-medium">{conn.requester?.name || conn.requester?.full_name || 'Unknown'}</td>
                        <td className="px-4 py-3 font-medium">{conn.recipient?.name || conn.recipient?.full_name || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            conn.status === 'Accepted' ? 'default' : 
                            conn.status === 'Declined' ? 'destructive' : 
                            'secondary'
                          }>
                            {conn.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {format(new Date(conn.createdAt), 'MMM d, yyyy HH:mm')}
                        </td>
                      </tr>
                    ))}
                    {connections.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No connections found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
