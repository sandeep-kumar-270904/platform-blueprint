import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, ArrowRight, Video, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ConnectionsNetworkPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'requests';
  
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mentorship goals state
  const [expandedMentorshipId, setExpandedMentorshipId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({});
  const [generatingAIPrep, setGeneratingAIPrep] = useState<string | null>(null);

  // Respond state
  const [respondId, setRespondId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const [outRes, inRes, mentRes] = await Promise.all([
        fetch(`${API_URL}/api/alumni/connections/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/alumni/connections/inbox`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/alumni/connections/mentorships`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (outRes.ok) setOutgoingRequests(await outRes.json());
      if (inRes.ok) setIncomingRequests(await inRes.json());
      if (mentRes.ok) setMentorships(await mentRes.json());
    } catch (err) {
      toast.error('Failed to load network data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, status: 'accepted' | 'declined', type: string) => {
    // If it's a Q&A request and accepting, we need a response text
    if (status === 'accepted' && type === 'qa' && !responseText.trim() && respondId === id) {
      toast.error('Please provide an answer to the question');
      return;
    }
    
    // If accepting Q&A but haven't opened the response box yet
    if (status === 'accepted' && type === 'qa' && respondId !== id) {
      setRespondId(id);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alumni/connections/${id}/respond`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          response: responseText.trim() ? responseText : undefined 
        })
      });

      if (!res.ok) throw new Error('Failed to respond');
      
      toast.success(status === 'accepted' ? 'Request accepted!' : 'Request declined');
      setRespondId(null);
      setResponseText('');
      fetchRequests();
    } catch (error) {
      toast.error('Error updating request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
      case 'accepted': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Accepted</Badge>;
      case 'declined': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Declined</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'qa': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'session_1on1': return <Video className="w-4 h-4 text-purple-500" />;
      default: return <ArrowRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'qa': return 'Quick Q&A';
      case 'session_1on1': return '1:1 Session';
      case 'relay': return 'Career Relay';
      default: return type;
    }
  };

  const handleAddGoal = async (mentorshipId: string) => {
    if (!newGoalTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alumni/connections/mentorships/${mentorshipId}/goals`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newGoalTitle })
      });
      if (res.ok) {
        const updated = await res.json();
        setMentorships(prev => prev.map(m => m._id === mentorshipId ? updated : m));
        setNewGoalTitle('');
        toast.success('Goal added');
      }
    } catch (err) {
      toast.error('Failed to add goal');
    }
  };

  const handleUpdateGoalStatus = async (mentorshipId: string, goalId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alumni/connections/mentorships/${mentorshipId}/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setMentorships(prev => prev.map(m => m._id === mentorshipId ? updated : m));
      }
    } catch (err) {
      toast.error('Failed to update goal');
    }
  };

  const handleGeneratePrep = async (sessionId: string, alumniName: string, alumniRole: string, alumniCompany: string) => {
    try {
      setGeneratingAIPrep(sessionId);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ai/session-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alumniName,
          alumniRole,
          alumniCompany,
          alumniHistory: [] // Can be populated if deeply fetched
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiNotes(prev => ({ ...prev, [sessionId]: data.notes }));
        toast.success('Session prep generated!');
      }
    } catch (err) {
      toast.error('Failed to generate session prep notes');
    } finally {
      setGeneratingAIPrep(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  );

  const acceptedRequests = [...outgoingRequests, ...incomingRequests].filter(r => r.status === 'accepted' || r.status === 'completed');
  const upcomingSessions = acceptedRequests.filter(r => r.generatedEventId);
  
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="max-w-5xl mx-auto p-4 md:p-6 mt-6 pb-20 space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Network</h1>
          <p className="text-muted-foreground">Manage your connections, mentorships, and upcoming sessions.</p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="network">Connections</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="mentorships">Mentorships</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="network" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Connections</CardTitle>
                <CardDescription>People you have successfully connected with.</CardDescription>
              </CardHeader>
              <CardContent>
                {acceptedRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>You don't have any connections yet.</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link to="/alumni/connections/discover">Find Alumni</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {acceptedRequests.map(req => (
                      <div key={req._id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                            {(req.alumniUserId?._id === user?.id ? req.requesterId?.full_name : req.alumniUserId?.full_name)?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {req.alumniUserId?._id === user?.id ? req.requesterId?.full_name : req.alumniUserId?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              {getTypeIcon(req.type)} {getTypeLabel(req.type)} • {req.intent || 'Connection'}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/alumni/connections/messages?new=${req.alumniUserId?._id === user?.id ? req.requesterId?._id : req.alumniUserId?._id}`)}>Message</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-6 space-y-6">
            {/* INCOMING REQUESTS (Alumni perspective) */}
            <Card>
              <CardHeader>
                <CardTitle>Incoming Requests (Inbox)</CardTitle>
                <CardDescription>Requests from students seeking your guidance.</CardDescription>
              </CardHeader>
              <CardContent>
                {incomingRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">No incoming requests.</p>
                ) : (
                  <div className="space-y-4">
                    {incomingRequests.map(req => (
                      <div key={req._id} className="p-4 border rounded-lg bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{req.isAnonymous ? 'Anonymous Student' : req.requesterId?.full_name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {getTypeIcon(req.type)} {getTypeLabel(req.type)} 
                              {req.intent && ` • ${req.intent}`}
                            </p>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                          {req.message}
                        </div>

                        {req.status === 'pending' && (
                          <div className="space-y-3 pt-2">
                            {respondId === req._id && req.type === 'qa' && (
                              <Textarea 
                                placeholder="Type your answer here..."
                                value={responseText}
                                onChange={e => setResponseText(e.target.value)}
                                className="min-h-[100px]"
                              />
                            )}
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleRespond(req._id, 'accepted', req.type)}
                              >
                                {req.type === 'qa' && respondId !== req._id ? 'Answer' : (req.type === 'session_1on1' ? 'Accept & Generate Event' : 'Accept')}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleRespond(req._id, 'declined', req.type)}
                              >
                                Decline
                              </Button>
                              {respondId === req._id && (
                                <Button size="sm" variant="ghost" onClick={() => setRespondId(null)}>Cancel</Button>
                              )}
                            </div>
                          </div>
                        )}

                        {req.response && (
                          <div className="mt-3 bg-blue-50/50 p-3 rounded border border-blue-100">
                            <span className="text-xs font-semibold text-blue-700 uppercase">Your Reply:</span>
                            <p className="text-sm mt-1">{req.response}</p>
                          </div>
                        )}
                        
                        {req.generatedEventId && (
                          <Button variant="secondary" size="sm" className="mt-2 w-full" asChild>
                            <Link to={`/classrooms/${req.generatedEventId._id || req.generatedEventId}`}>Go to Session Room</Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OUTGOING REQUESTS (Student perspective) */}
            <Card>
              <CardHeader>
                <CardTitle>My Sent Requests</CardTitle>
                <CardDescription>Track the status of requests you've sent to alumni.</CardDescription>
              </CardHeader>
              <CardContent>
                {outgoingRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">You haven't sent any requests.</p>
                ) : (
                  <div className="space-y-4">
                    {outgoingRequests.map(req => (
                      <div key={req._id} className="p-4 border rounded-lg bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-600">To: <span className="text-gray-900">{req.alumniUserId?.full_name}</span></p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {getTypeIcon(req.type)} {getTypeLabel(req.type)}
                              {req.intent && ` • ${req.intent}`}
                            </p>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>

                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-500">
                          {req.message}
                        </div>

                        {req.response && (
                          <div className="mt-3 bg-green-50/50 p-3 rounded border border-green-100">
                            <span className="text-xs font-semibold text-green-700 uppercase">Alumni's Reply:</span>
                            <p className="text-sm mt-1">{req.response}</p>
                          </div>
                        )}

                        {req.generatedEventId && (
                          <Button variant="default" size="sm" className="mt-2 w-full" asChild>
                            <Link to={`/classrooms/${req.generatedEventId._id || req.generatedEventId}`}>Join Session Room</Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentorships" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Mentorships</CardTitle>
                <CardDescription>Track goals and progress with your mentors and mentees.</CardDescription>
              </CardHeader>
              <CardContent>
                {mentorships.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No active mentorships found.</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link to="/alumni/connections/discover">Find a Mentor</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mentorships.map(m => {
                      const isMentor = m.mentorId === user?.id;
                      const otherPersonName = isMentor ? m.menteeId?.full_name : m.alumniProfileId?.userId?.full_name;
                      const roleText = isMentor ? 'Mentee' : 'Mentor';

                      return (
                        <div key={m._id} className="p-4 border rounded-lg bg-white space-y-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-bold text-lg">{otherPersonName}</p>
                              <p className="text-sm text-primary font-medium">{roleText}</p>
                            </div>
                            <Badge variant="secondary" className="capitalize">{m.status}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            Started on {new Date(m.startDate).toLocaleDateString()}
                          </p>

                          <div className="pt-2 flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/alumni/connections/messages?new=${isMentor ? m.menteeId?._id : m.alumniProfileId?.userId?._id}`)}>
                              Message
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setExpandedMentorshipId(expandedMentorshipId === m._id ? null : m._id)}>
                              {expandedMentorshipId === m._id ? 'Hide Goals' : 'View Goals'}
                            </Button>
                          </div>
                          
                          {expandedMentorshipId === m._id && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                              <h4 className="font-semibold text-sm">Goals & Milestones</h4>
                              
                              {m.goals?.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No goals set yet.</p>
                              ) : (
                                <ul className="space-y-2">
                                  {m.goals.map((goal: any) => (
                                    <li key={goal._id} className="flex items-center gap-3 text-sm">
                                      <button 
                                        onClick={() => handleUpdateGoalStatus(m._id, goal._id, goal.status === 'completed' ? 'in_progress' : 'completed')}
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        {goal.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2" />}
                                      </button>
                                      <span className={goal.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                        {goal.title}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              <div className="flex gap-2 mt-2">
                                <input 
                                  type="text" 
                                  value={newGoalTitle}
                                  onChange={(e) => setNewGoalTitle(e.target.value)}
                                  placeholder="Add a new goal..."
                                  className="flex-1 border rounded-md px-3 py-1 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddGoal(m._id);
                                  }}
                                />
                                <Button size="sm" onClick={() => handleAddGoal(m._id)}>Add</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your accepted 1:1 and group mentorship sessions.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No upcoming sessions scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map(req => (
                      <div key={req._id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700">
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              1:1 Session with {req.alumniUserId?._id === user?.id ? req.requesterId?.full_name : req.alumniUserId?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {req.intent || 'Career Mentorship'}
                            </p>
                            
                            {aiNotes[req._id] && (
                              <div className="mt-3 bg-primary/5 p-3 rounded-md text-sm border border-primary/10">
                                <p className="font-semibold flex items-center gap-1 mb-1 text-primary">
                                  <Sparkles className="w-3 h-3" /> AI Prep Notes
                                </p>
                                <p className="whitespace-pre-wrap text-gray-700">{aiNotes[req._id]}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
{/* AI Feature hidden for now
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                            onClick={() => handleGeneratePrep(
                              req._id, 
                              req.alumniUserId?._id === user?.id ? req.requesterId?.full_name : req.alumniUserId?.full_name,
                              'Mentor', 
                              'Tech Industry'
                            )}
                            disabled={generatingAIPrep === req._id}
                          >
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            {generatingAIPrep === req._id ? 'Generating...' : 'Prep with AI'}
                          </Button>
                          */}
                          <Button asChild>
                            <Link to={`/classrooms/${req.generatedEventId._id || req.generatedEventId}`}>Join Room</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
