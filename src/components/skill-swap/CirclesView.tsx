import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Users, Clock, Calendar, MessageSquare, Search, Plus, Trophy } from "lucide-react";
import { 
  useCircles, 
  useMyCircles, 
  useCreateCircle, 
  useJoinCircle, 
  useLeaveCircle,
  useRecommendedCircles,
  SkillCircle 
} from "@/hooks/useSkillSwap";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

export function CirclesView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeCircleChat, setActiveCircleChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  const { data: browseData, isLoading: isBrowsing } = useCircles(1, 20, search, category);
  const { data: myCircles, isLoading: myLoading } = useMyCircles();
  const { data: recommendedCircles, isLoading: recLoading } = useRecommendedCircles();

  const createMutation = useCreateCircle();
  const joinMutation = useJoinCircle();
  const leaveMutation = useLeaveCircle();

  useEffect(() => {
    if (!activeCircleChat || !user?._id) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_circle_room', { circleId: activeCircleChat, userId: user._id });

    newSocket.on('new_circle_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.emit('leave_circle_room', { circleId: activeCircleChat });
      newSocket.disconnect();
    };
  }, [activeCircleChat, user]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      skillName: formData.get('skillName') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      maxMembers: parseInt(formData.get('maxMembers') as string),
      recurrence: formData.get('recurrence') as any,
      scheduleInfo: {
        dayOfWeek: formData.get('dayOfWeek') as string,
        time: formData.get('time') as string
      }
    };
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Circle Created!" });
      setIsCreating(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const handleJoin = async (id: string) => {
    try {
      await joinMutation.mutateAsync(id);
      toast({ title: "Joined Circle!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const handleLeave = async (id: string) => {
    try {
      await leaveMutation.mutateAsync(id);
      toast({ title: "Left Circle" });
      if (activeCircleChat === id) setActiveCircleChat(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !chatMessage.trim() || !activeCircleChat || !user) return;
    socket.emit('send_circle_message', {
      circleId: activeCircleChat,
      userId: user._id,
      content: chatMessage
    });
    setChatMessage("");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Skill Circles</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Start a Circle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a Skill Circle</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input name="skillName" placeholder="Topic (e.g. Weekly JS algorithms)" required />
              <Input name="category" placeholder="Category" required />
              <Input name="description" placeholder="Description" required />
              <Input type="number" name="maxMembers" placeholder="Max Members (default 8)" defaultValue={8} min={2} max={20} required />
              <select name="recurrence" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="one-time">One-time</option>
              </select>
              <div className="flex gap-2">
                <Input name="dayOfWeek" placeholder="Day (e.g. Monday)" />
                <Input type="time" name="time" required />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Col: My Circles & Browse */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">My Circles</h3>
            {myLoading ? <p>Loading...</p> : myCircles?.length === 0 ? <p className="text-muted-foreground text-sm">You haven't joined any circles.</p> : (
              <div className="space-y-4">
                {myCircles?.map(circle => (
                  <Card key={circle._id} className={`cursor-pointer hover:border-primary transition-colors ${activeCircleChat === circle._id ? 'border-primary shadow-sm' : ''}`} onClick={() => setActiveCircleChat(circle._id)}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold">{circle.skillName}</h4>
                        <Badge variant="outline">{circle.members.length}/{circle.maxMembers} <Users className="h-3 w-3 ml-1 inline" /></Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm flex justify-between items-end">
                      <div>
                        <p className="text-muted-foreground line-clamp-1">{circle.description}</p>
                        <p className="mt-2 text-xs text-primary font-medium"><Calendar className="h-3 w-3 inline mr-1" /> {circle.recurrence} ({circle.scheduleInfo?.dayOfWeek} {circle.scheduleInfo?.time})</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleLeave(circle._id); }}>Leave</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Recommended Circles */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Trophy className="text-primary h-5 w-5"/> Recommended for You</h3>
              {recLoading ? <p>Loading recommendations...</p> : recommendedCircles?.length === 0 ? <p className="text-muted-foreground text-sm">No specific recommendations yet.</p> : (
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                  {recommendedCircles?.map((circle: SkillCircle) => (
                    <Card key={circle._id} className="min-w-[280px] flex-shrink-0 border-primary/20">
                      <CardContent className="p-4 flex flex-col gap-2 h-full justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold">{circle.skillName}</h4>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">{circle.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{circle.description}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-medium"><Users className="h-3 w-3 inline mr-1"/> {circle.members.length}/{circle.maxMembers}</span>
                          <Button size="sm" onClick={() => handleJoin(circle._id)}>Join</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold mb-4">Browse All Circles</h3>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Input placeholder="Category" className="w-32" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            {isBrowsing ? <p>Loading...</p> : browseData?.circles?.length === 0 ? <p className="text-muted-foreground text-sm">No open circles found.</p> : (
              <div className="space-y-4">
                {browseData?.circles?.map((circle: SkillCircle) => (
                  <Card key={circle._id}>
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between">
                        <h4 className="font-bold">{circle.skillName}</h4>
                        <Badge variant="secondary">{circle.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{circle.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-medium"><Users className="h-3 w-3 inline mr-1"/> {circle.members.length}/{circle.maxMembers}</span>
                        {!myCircles?.some(c => c._id === circle._id) && (
                          <Button size="sm" onClick={() => handleJoin(circle._id)}>Join Circle</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Chat Panel */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center"><MessageSquare className="mr-2 h-5 w-5" /> Circle Chat</h3>
          {!activeCircleChat ? (
            <Card className="h-[500px] flex items-center justify-center bg-muted/50">
              <p className="text-muted-foreground">Select one of your circles to view chat.</p>
            </Card>
          ) : (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b p-4 bg-primary/5">
                <h4 className="font-bold">{myCircles?.find(c => c._id === activeCircleChat)?.skillName} Chat</h4>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && <p className="text-center text-muted-foreground text-sm mt-4">Start the conversation!</p>}
                {messages.map((msg, i) => {
                  const isMe = msg.sender?._id === user?._id;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {!isMe && <p className="text-xs font-bold mb-1">{msg.sender?.name || 'User'}</p>}
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <div className="p-4 border-t bg-background">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
                  <Button type="submit">Send</Button>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
