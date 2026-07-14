import { useState, useEffect, useRef } from "react";
import { Send, Users, Sparkles, Plus, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  topic: string;
  description: string | null;
  icon: string | null;
  is_active: boolean | null;
  mentor_led: boolean | null;
  participant_count: number | null;
  created_at: string | null;
}

interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: string | null;
  is_mentor_message: boolean | null;
  created_at: string | null;
  username?: string | null;
}

// Seed rooms to ensure at least some exist
const defaultRoomSeeds = [];

export const BrainstormRooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", topic: "" });
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSendRef = useRef<number>(0);
  const lastTypingRef = useRef<number>(0);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/innovation/rooms`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setRooms(data);
          } else {
            setRooms(defaultRoomSeeds.map((r, i) => ({
              id: `seed-${i}`,
              ...r,
              is_active: true,
              mentor_led: false,
              participant_count: 0,
              created_at: new Date().toISOString(),
            })));
          }
        }
      } catch {}
      setLoadingRooms(false);
    };
    fetchRooms();
  }, []);

  // Fetch messages when room selected
  useEffect(() => {
    if (!selectedRoomId || selectedRoomId.startsWith("seed-")) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const fetchMessages = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/innovation/rooms/${selectedRoomId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {}
      setLoadingMessages(false);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedRoomId, user]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedRoomId || sending) return;
    if (selectedRoomId.startsWith("seed-")) {
      toast.error("Sign in and use a real room to send messages");
      return;
    }
    const now = Date.now();
    if (now - lastSendRef.current < 500) return; // Rate limit: 500ms between sends
    lastSendRef.current = now;
    const content = newMessage.trim();
    if (content.length > 1000) { toast.error("Message too long (max 1000 chars)"); return; }
    setSending(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/innovation/rooms/${selectedRoomId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      setNewMessage("");
    } catch {
      toast.error("Failed to send message");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim() || !user || creatingRoom) return;
    setCreatingRoom(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/rooms`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoom.name.trim(),
          topic: newRoom.name.trim().toLowerCase().replace(/\s+/g, "-"),
          description: newRoom.description || null,
        })
      });
      if (res.ok) {
        toast.success(`Room "${newRoom.name}" created!`);
        setCreateOpen(false);
        setNewRoom({ name: "", description: "", topic: "" });
        // Room will be refetched by interval or next mount
      } else {
        toast.error("Failed to create room");
      }
    } catch {
      toast.error("Failed to create room");
    }
    setCreatingRoom(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Brainstorm Rooms
          </h2>
          <p className="text-muted-foreground">Join topic-based discussions and brainstorm with peers & mentors</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Brainstorm Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Room name" value={newRoom.name} onChange={e => setNewRoom(prev => ({ ...prev, name: e.target.value }))} maxLength={100} />
              <Textarea placeholder="Description" value={newRoom.description} onChange={e => setNewRoom(prev => ({ ...prev, description: e.target.value }))} maxLength={500} />
              <Button onClick={handleCreateRoom} className="w-full" disabled={!user || !newRoom.name.trim() || creatingRoom}>
                {creatingRoom ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {!user ? "Sign in to create" : "Create Room"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {loadingRooms ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            rooms.map((room, i) => (
              <motion.div key={room.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedRoomId === room.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{room.icon || "💡"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{room.name}</h3>
                          {room.mentor_led && (
                            <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                              <GraduationCap className="h-3 w-3" /> Mentor
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{room.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {room.participant_count || 0}
                          </span>
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedRoomId ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedRoom?.icon || "💡"}</span>
                    <div>
                      <h3 className="font-semibold">{selectedRoom?.name}</h3>
                      <p className="text-xs text-muted-foreground">{selectedRoom?.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Users className="h-3 w-3" /> {selectedRoom?.participant_count || 0} online
                  </Badge>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 group"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={msg.is_mentor_message ? "bg-primary text-primary-foreground" : "bg-muted"}>
                              {(msg.username || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{msg.username || "User"}</span>
                              {msg.is_mentor_message && (
                                <Badge variant="secondary" className="text-[10px] py-0 gap-1">
                                  <GraduationCap className="h-2.5 w-2.5" /> Mentor
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : "now"}
                              </span>
                            </div>
                            <p className={`text-sm mt-1 ${msg.is_mentor_message ? "bg-primary/5 p-2 rounded-lg border border-primary/20" : ""}`}>
                              {msg.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {messages.length === 0 && !loadingMessages && (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {typingUser && (
                <div className="px-4 py-1 text-xs text-muted-foreground flex items-center gap-1">
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </span>
                  {typingUser} is typing...
                </div>
              )}

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => {
                      setNewMessage(e.target.value);
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder={user ? "Share your thoughts..." : "Sign in to chat"}
                    className="flex-1"
                    disabled={!user}
                    maxLength={1000}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || !user || sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-lg font-semibold text-muted-foreground">Select a room to join</h3>
                <p className="text-sm text-muted-foreground/70">Pick a topic and start brainstorming with the community</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
