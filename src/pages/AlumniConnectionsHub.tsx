import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageCircle, HelpCircle, Calendar, Send, ExternalLink, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AlumniConnectionsHub: React.FC = () => {
  const { user } = useAuth();
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For replying
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const [outRes, inRes] = await Promise.all([
        fetch(`${API_URL}/api/alumni/connections/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/alumni/connections/inbox`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (outRes.ok) setOutgoing(await outRes.json());
      if (inRes.ok) setIncoming(await inRes.json());
    } catch (err) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, status: 'accepted' | 'declined', type: string) => {
    const token = localStorage.getItem('token');
    const response = replyText[id] || '';

    if (status === 'accepted' && (type === 'qa' || type === 'relay') && !response.trim()) {
      toast.error('Please enter a response.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/alumni/connections/${id}/respond`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, response })
      });

      if (res.ok) {
        toast.success(status === 'accepted' ? 'Response sent!' : 'Request declined.');
        setReplyText(prev => ({ ...prev, [id]: '' }));
        fetchConnections();
      } else {
        toast.error('Failed to update request');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const renderIcon = (type: string) => {
    switch(type) {
      case 'qa': return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'relay': return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'session_1on1': return <Calendar className="w-5 h-5 text-purple-500" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'qa': return 'Public Q&A';
      case 'relay': return 'Private Relay';
      case 'session_1on1': return '1:1 Session';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'accepted': return <Badge variant="default" className="bg-green-600">Accepted</Badge>;
      case 'declined': return <Badge variant="destructive">Declined</Badge>;
      case 'completed': return <Badge variant="default" className="bg-blue-600">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading connections...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 mt-6">
        <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Connections Hub</h1>
          <p className="text-muted-foreground">Manage your alumni interactions, Q&As, and 1:1 sessions.</p>
        </div>
      </div>

      <Tabs defaultValue="outgoing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="outgoing">My Requests</TabsTrigger>
          <TabsTrigger value="incoming">
            Alumni Inbox 
            {incoming.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {incoming.filter(r => r.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="space-y-4 mt-6">
          {outgoing.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                <ShieldCheck className="w-12 h-12 text-gray-300" />
                <p>You haven't sent any connection requests yet.</p>
                <Button variant="outline" asChild>
                  <Link to="/college-insights">Browse Alumni Directory</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            outgoing.map(req => (
              <Card key={req._id}>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={req.alumniUserId?.avatar_url} />
                        <AvatarFallback>{req.alumniUserId?.full_name?.charAt(0) || 'A'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{req.alumniUserId?.full_name || 'Alumni'}</CardTitle>
                        <CardDescription>{req.alumniProfileId?.currentRole} @ {req.alumniProfileId?.currentCompany}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    {renderIcon(req.type)}
                    <span>{getTypeLabel(req.type)}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">
                    <span className="font-semibold text-gray-700">You asked:</span><br/>
                    {req.message}
                  </div>

                  {(req.status === 'completed' || req.status === 'accepted') && req.response && (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-sm whitespace-pre-wrap">
                      <span className="font-semibold text-blue-900">Alumni Response:</span><br/>
                      {req.response}
                    </div>
                  )}

                  {req.generatedEventId && (req.status === 'accepted' || req.status === 'completed') && (
                    <div className="flex items-center justify-between bg-purple-50 p-3 rounded-md border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Virtual Session Scheduled</span>
                      </div>
                      <Button size="sm" asChild className="bg-purple-600 hover:bg-purple-700">
                        <Link to={`/classrooms/${req.generatedEventId._id}`}>
                          Join Room <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-4 mt-6">
          {incoming.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No incoming requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            incoming.map(req => (
              <Card key={req._id}>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={req.isAnonymous ? '' : req.requesterId?.avatar_url} />
                        <AvatarFallback>{req.isAnonymous ? 'S' : req.requesterId?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{req.isAnonymous ? 'Anonymous Student' : req.requesterId?.full_name}</CardTitle>
                        <CardDescription>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    {renderIcon(req.type)}
                    <span>{getTypeLabel(req.type)}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">
                    {req.message}
                  </div>

                  {req.status === 'pending' && (
                    <div className="space-y-3 pt-2">
                      {(req.type === 'qa' || req.type === 'relay') && (
                        <Textarea 
                          placeholder="Type your response here..."
                          value={replyText[req._id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [req._id]: e.target.value }))}
                          className="min-h-[100px]"
                        />
                      )}
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleRespond(req._id, 'accepted', req.type)}
                          className={req.type === 'session_1on1' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        >
                          {req.type === 'session_1on1' ? 'Accept & Generate Event' : 'Send Answer'}
                        </Button>
                        <Button variant="destructive" onClick={() => handleRespond(req._id, 'declined', req.type)}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  {(req.status === 'completed' || req.status === 'accepted') && req.response && (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-sm whitespace-pre-wrap">
                      <span className="font-semibold text-blue-900">Your Response:</span><br/>
                      {req.response}
                    </div>
                  )}

                  {req.generatedEventId && (req.status === 'accepted' || req.status === 'completed') && (
                    <div className="flex items-center justify-between bg-purple-50 p-3 rounded-md border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Virtual Session Generated</span>
                      </div>
                      <Button size="sm" asChild className="bg-purple-600 hover:bg-purple-700">
                        <Link to={`/classrooms/${req.generatedEventId._id}`}>
                          Go to Event <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
};
