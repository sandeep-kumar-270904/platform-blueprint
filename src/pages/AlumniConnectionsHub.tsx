import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Compass, Users, MessageSquare, Briefcase, Calendar, ChevronRight, UserPlus } from 'lucide-react';
import { AlumniCard } from '@/components/alumni/AlumniCard';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AlumniConnectionsHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendedAlumni, setRecommendedAlumni] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState({
    connections: 0,
    pendingRequests: 0,
    activeConversations: 0,
    upcomingSessions: 0
  });
  const [searchIntent, setSearchIntent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      
      // Fetch some recommended alumni (using the directory endpoint for now)
      const dirRes = await fetch(`${API_URL}/api/alumni/directory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dirRes.ok) {
        const data = await dirRes.json();
        // Just take first 3 as recommendations
        setRecommendedAlumni(data.alumni.slice(0, 3));
      }

      // Fetch requests to build stats
      const [outRes, inRes] = await Promise.all([
        fetch(`${API_URL}/api/alumni/connections/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/alumni/connections/inbox`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      let outReqs = [];
      let inReqs = [];
      if (outRes.ok) outReqs = await outRes.json();
      if (inRes.ok) inReqs = await inRes.json();

      const allReqs = [...outReqs, ...inReqs];
      const pending = allReqs.filter(r => r.status === 'pending').length;
      const sessions = allReqs.filter(r => r.generatedEventId && (r.status === 'accepted' || r.status === 'completed')).length;
      const activeConvs = allReqs.filter(r => r.status === 'accepted' && (r.type === 'qa' || r.type === 'relay')).length;
      const acceptedConns = allReqs.filter(r => r.status === 'accepted').length;

      setNetworkStats({
        connections: acceptedConns,
        pendingRequests: pending,
        activeConversations: activeConvs,
        upcomingSessions: sessions
      });
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchIntent.trim()) return;
    navigate(`/alumni/connections/discover?intent=${encodeURIComponent(searchIntent)}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-6 space-y-10 pb-20">
        
        {/* Top Section: Hero & Intent Search */}
        <section className="text-center space-y-6 max-w-3xl mx-auto py-8">
          <h1 className="text-4xl font-bold tracking-tight">Connections Hub</h1>
          <p className="text-xl text-muted-foreground">Build relationships that move you forward. Find people who have already done what you're trying to do.</p>
          
          <form onSubmit={handleSearch} className="relative mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              value={searchIntent}
              onChange={(e) => setSearchIntent(e.target.value)}
              placeholder="What are you trying to achieve? (e.g. 'I want an AI internship' or 'Resume review')" 
              className="pl-12 pr-32 h-14 text-lg rounded-full shadow-sm border-gray-200 focus-visible:ring-primary/20"
            />
            <Button type="submit" size="lg" className="absolute right-1.5 top-1.5 rounded-full h-11 px-6">
              Find People
            </Button>
          </form>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area (Left 2/3) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" /> Explore
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-24 flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200" asChild>
                  <Link to="/alumni/connections/discover">
                    <UserPlus className="w-6 h-6 text-blue-500" />
                    <span>Find Mentor</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200" asChild>
                  <Link to="/alumni/connections/discover">
                    <MessageSquare className="w-6 h-6 text-purple-500" />
                    <span>Ask Alumni</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200" onClick={() => toast.info('Career Paths coming soon')}>
                  <Compass className="w-6 h-6 text-green-500" />
                  <span>Career Paths</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200" onClick={() => toast.info('Opportunities coming soon')}>
                  <Briefcase className="w-6 h-6 text-orange-500" />
                  <span>Opportunities</span>
                </Button>
              </div>
            </section>

            {/* Recommended Alumni */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Recommended Alumni
                </h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                  <Link to="/alumni/connections/discover">View all <ChevronRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              
              {recommendedAlumni.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedAlumni.map(alumni => (
                    <AlumniCard key={alumni._id} profile={alumni} />
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>Complete your profile to get personalized recommendations.</p>
                  </CardContent>
                </Card>
              )}
            </section>

          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-6">
            
            {/* Alumni Claim CTA */}
            <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Are you an Alumni?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary-foreground/80 mb-4">
                  Received an invitation from your college? Enter your token to claim your official alumni profile.
                </p>
                <Button variant="secondary" className="w-full font-medium" onClick={() => {
                  const token = window.prompt("Enter your claim token from the email:");
                  if (token) {
                    navigate(`/claim-alumni?token=${token}`);
                  }
                }}>
                  Claim Profile
                </Button>
              </CardContent>
            </Card>

            {/* My Network Summary */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-semibold">My Network</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <Link to="/alumni/connections/network" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-md"><Users className="w-4 h-4 text-blue-700" /></div>
                      <span className="font-medium text-sm">Connections</span>
                    </div>
                    <span className="text-lg font-semibold">{networkStats.connections}</span>
                  </Link>
                  <Link to="/alumni/connections/network?tab=requests" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-md"><UserPlus className="w-4 h-4 text-orange-700" /></div>
                      <span className="font-medium text-sm">Pending Requests</span>
                    </div>
                    <span className="text-lg font-semibold">{networkStats.pendingRequests}</span>
                  </Link>
                  <Link to="/alumni/connections/network" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-md"><MessageSquare className="w-4 h-4 text-green-700" /></div>
                      <span className="font-medium text-sm">Conversations</span>
                    </div>
                    <span className="text-lg font-semibold">{networkStats.activeConversations}</span>
                  </Link>
                  <Link to="/alumni/connections/network?tab=sessions" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-md"><Calendar className="w-4 h-4 text-purple-700" /></div>
                      <span className="font-medium text-sm">Upcoming Sessions</span>
                    </div>
                    <span className="text-lg font-semibold">{networkStats.upcomingSessions}</span>
                  </Link>
                </div>
              </CardContent>
              <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                <Button variant="default" className="w-full" asChild>
                  <Link to="/alumni/connections/network">Manage Network</Link>
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};
