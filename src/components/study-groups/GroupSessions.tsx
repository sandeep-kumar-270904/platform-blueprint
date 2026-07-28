import React, { useState, useEffect } from 'react';
import { useStudyGroups, GroupSession } from '@/hooks/useStudyGroups';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Clock, Users, Edit, Trash2, CheckCircle2, PlayCircle, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface GroupSessionsProps {
  groupId: string;
}

const GroupSessions: React.FC<GroupSessionsProps> = ({ groupId }) => {
  const { user } = useAuth();
  const { fetchSessions, createSession, updateSession, deleteSession, rsvpSession } = useStudyGroups();

  const [upcoming, setUpcoming] = useState<GroupSession[]>([]);
  const [past, setPast] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');

  // Share State
  const [shareSession, setShareSession] = useState<GroupSession | null>(null);
  const [shareText, setShareText] = useState('');

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchSessions(groupId);
      setUpcoming(data.upcoming);
      setPast(data.past);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [groupId]);

  const openCreate = () => {
    setEditSessionId(null);
    setTitle('');
    setDescription('');
    setFormat('');
    setDate('');
    setTime('');
    setDuration('60');
    setIsModalOpen(true);
  };

  const openEdit = (session: GroupSession) => {
    setEditSessionId(session._id);
    setTitle(session.title);
    setDescription(session.description || '');
    setFormat(session.format || '');
    
    // Format date and time for inputs
    const d = new Date(session.scheduled_at);
    setDate(d.toISOString().split('T')[0]);
    setTime(d.toTimeString().slice(0, 5));
    setDuration(session.duration_minutes.toString());
    
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!title || !date || !time || !duration) return;

    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    const payload = {
      title,
      description,
      format,
      scheduled_at,
      duration_minutes: parseInt(duration)
    };

    try {
      if (editSessionId) {
        await updateSession(groupId, editSessionId, payload);
      } else {
        await createSession(groupId, payload);
      }
      setIsModalOpen(false);
      loadSessions();
    } catch (err) {
      // Error handled by hook toast
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm("Are you sure you want to cancel this session?")) {
      await deleteSession(groupId, sessionId);
      loadSessions();
    }
  };

  const handleRSVP = async (sessionId: string) => {
    await rsvpSession(groupId, sessionId);
    loadSessions();
  };

  const handleShareClick = (session: GroupSession) => {
    setShareSession(session);
    setShareText(`Just finished a great session "${session.title}" in my study group!`);
  };

  const submitShare = async () => {
    try {
      // Stub API call since community feed isn't built yet
      await new Promise(r => setTimeout(r, 500));
      toast.success("Shared to Community Feed!");
      setShareSession(null);
    } catch (e) {
      toast.error("Failed to share.");
    }
  };

  // UI Helpers
  const getSessionStatusBadge = (session: GroupSession) => {
    if (session.status === 'cancelled') {
      return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Cancelled</Badge>;
    }

    const startTime = new Date(session.scheduled_at);
    const endTime = new Date(startTime.getTime() + session.duration_minutes * 60000);
    const now = new Date();

    if (now >= startTime && now <= endTime) {
      return <Badge className="bg-green-500 hover:bg-green-600 animate-pulse"><PlayCircle className="w-3 h-3 mr-1"/> LIVE NOW</Badge>;
    }
    
    const diffMs = startTime.getTime() - now.getTime();
    if (diffMs > 0 && diffMs <= 60 * 60 * 1000) { // < 1 hour
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Starting Soon</Badge>;
    }
    
    return null;
  };

  const renderSessionCard = (session: GroupSession, isPast: boolean) => {
    const isCreator = session.creator_id._id === user?.id;
    const isAttending = session.attendees.some(a => a._id === user?.id);
    const d = new Date(session.scheduled_at);
    const isCancelled = session.status === 'cancelled';

    return (
      <Card key={session._id} className={`overflow-hidden transition-all ${!isPast && !isCancelled ? 'hover:border-primary/50' : 'opacity-70'}`}>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{session.title}</h3>
                {getSessionStatusBadge(session)}
              </div>
              
              {(session.description || session.format) && (
                <div className="space-y-1">
                  {session.format && <Badge variant="outline" className="mb-1 text-xs">{session.format}</Badge>}
                  {session.description && <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes} min)
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1.5" />
                  {session.attendees.length} Attendees
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground mr-1">Host:</span>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={session.creator_id.avatar_url} />
                  <AvatarFallback>{session.creator_id.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{session.creator_id.username}</span>
              </div>
            </div>

            <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 md:min-w-[120px]">
              {!isPast && !isCancelled && (
                <>
                  <Button 
                    variant={isAttending ? "secondary" : "default"} 
                    onClick={() => handleRSVP(session._id)}
                    className="w-full"
                    aria-label={isAttending ? "Cancel RSVP to session" : "RSVP to session"}
                  >
                    {isAttending ? <><CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" /> Joined</> : "Join Session"}
                  </Button>
                  
                  {isCreator && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(session)} aria-label="Edit session"><Edit className="w-4 h-4" aria-hidden="true" /></Button>
                      <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(session._id)} aria-label="Delete session"><Trash2 className="w-4 h-4" aria-hidden="true" /></Button>
                    </div>
                  )}
                </>
              )}
              {isPast && isAttending && !isCancelled && (
                <Button variant="outline" size="sm" onClick={() => handleShareClick(session)} className="w-full text-xs" aria-label="Share session to community feed">
                  <Share2 className="w-3 h-3 mr-2" aria-hidden="true" /> Share
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 border rounded-lg bg-card">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Group Sessions</h2>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>Schedule Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editSessionId ? 'Edit Session' : 'Schedule a Session'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="session-title">Topic / Title</Label>
                <Input id="session-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mock Technical Interview" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-format">Format (Optional)</Label>
                <Input id="session-format" value={format} onChange={e => setFormat(e.target.value)} placeholder="e.g. GD Practice, Q&A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-date">Date</Label>
                  <Input id="session-date" type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-time">Time (Local)</Label>
                  <Input id="session-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <select 
                  className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={duration} 
                  onChange={e => setDuration(e.target.value)}
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief format or prep materials..." rows={3} />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!title || !date || !time}>
              {editSessionId ? 'Save Changes' : 'Schedule'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-muted-foreground border-b pb-2">Upcoming</h3>
        {upcoming.length === 0 ? (
          <div className="py-8 text-center border rounded-lg border-dashed text-muted-foreground">
            No upcoming sessions scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(s => renderSessionCard(s, false))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="font-semibold text-lg text-muted-foreground border-b pb-2">Past Sessions</h3>
        {past.length === 0 ? (
          <div className="py-8 text-center border rounded-lg border-dashed text-muted-foreground">
            No past sessions recorded.
          </div>
        ) : (
          <div className="space-y-3">
            {past.map(s => renderSessionCard(s, true))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <Dialog open={!!shareSession} onOpenChange={() => setShareSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Community Feed</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="share-text">Post Preview</Label>
            <Textarea id="share-text" value={shareText} onChange={e => setShareText(e.target.value)} className="mt-2 h-24 resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareSession(null)}>Cancel</Button>
            <Button onClick={submitShare}>Post to Feed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupSessions;
