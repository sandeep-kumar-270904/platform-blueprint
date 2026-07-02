import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Users,
  MessageCircle,
  Highlighter,
  ChevronLeft,
  ChevronRight,
  Send,
  LogOut,
} from "lucide-react";

interface Annotation {
  id: string;
  user_id: string;
  page_number: number;
  position: any;
  color: string;
  text_content?: string;
  comment?: string;
  profiles?: any;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: any;
}

interface Participant {
  id: string;
  user_id: string;
  profiles?: any;
}

const StudySession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#fbbf24");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to join study sessions");
      navigate("/auth");
      return;
    }

    if (user && sessionId) {
      loadSession();
      joinSession();
      subscribeToUpdates();
    }
  }, [user, authLoading, sessionId]);

  const loadSession = async () => {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*, notes(*)")
      .eq("id", sessionId)
      .single();

    if (error) {
      toast.error("Failed to load session");
      navigate("/notes");
      return;
    }

    setSession(data);
    setCurrentPage(data.current_page || 1);
    loadAnnotations(data.current_page);
    loadParticipants();
    loadMessages();
  };

  const joinSession = async () => {
    const { error } = await supabase
      .from("session_participants")
      .insert({ session_id: sessionId, user_id: user?.id })
      .select()
      .maybeSingle();

    if (error && !error.message.includes("duplicate")) {
      toast.error("Failed to join session");
    }
  };

  const leaveSession = async () => {
    await supabase
      .from("session_participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", user?.id);

    navigate("/notes");
  };

  const loadAnnotations = async (page: number) => {
    if (!session?.note_id) return;
    
    const { data } = await supabase
      .from("annotations")
      .select("*")
      .eq("note_id", session.note_id)
      .eq("page_number", page);

    if (data) setAnnotations(data as any);
  };

  const loadParticipants = async () => {
    const { data } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId);

    if (data) setParticipants(data as any);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data as any);
  };

  const subscribeToUpdates = () => {
    const channel = supabase.channel(`session-${sessionId}`);

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "annotations" },
        () => loadAnnotations(currentPage)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_participants" },
        () => loadParticipants()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => loadMessages()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "study_sessions" },
        (payload) => {
          if (payload.new.current_page !== currentPage) {
            setCurrentPage(payload.new.current_page);
            loadAnnotations(payload.new.current_page);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: user?.id,
      message: newMessage,
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    createAnnotation(x, y);
  };

  const createAnnotation = async (x: number, y: number) => {
    const { error } = await supabase.from("annotations").insert({
      note_id: session?.note_id,
      user_id: user?.id,
      page_number: currentPage,
      position: { x, y, width: 10, height: 2 },
      color: selectedColor,
    });

    if (error) {
      toast.error("Failed to create annotation");
    }
  };

  const syncPage = async (newPage: number) => {
    if (session?.host_id !== user?.id) {
      toast.error("Only the host can change pages");
      return;
    }

    const { error } = await supabase
      .from("study_sessions")
      .update({ current_page: newPage })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to sync page");
    }
  };

  const colors = [
    { name: "Yellow", value: "#fbbf24" },
    { name: "Green", value: "#34d399" },
    { name: "Blue", value: "#60a5fa" },
    { name: "Pink", value: "#f472b6" },
    { name: "Purple", value: "#a78bfa" },
  ];

  if (authLoading || !session) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{session.session_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {session.notes?.title} - Page {currentPage}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={leaveSession}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave
                </Button>
              </div>

              {/* Highlighting Tools */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                <Highlighter className="h-4 w-4" />
                <span className="text-sm font-medium">Highlight:</span>
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>

              {/* Canvas Area */}
              <div className="relative bg-white rounded-lg border p-8 min-h-[500px]">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseUp={() => setIsDrawing(false)}
                  className="absolute inset-0 w-full h-full cursor-crosshair"
                />
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="absolute rounded transition-opacity hover:opacity-75"
                    style={{
                      left: `${annotation.position.x}%`,
                      top: `${annotation.position.y}%`,
                      width: `${annotation.position.width}%`,
                      height: `${annotation.position.height}%`,
                      backgroundColor: annotation.color,
                      opacity: 0.4,
                    }}
                    title={`By ${annotation.profiles?.username || "Unknown"}`}
                  />
                ))}
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => syncPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {session.host_id === user?.id && "You control the page"}
                </span>
                <Button variant="outline" onClick={() => syncPage(currentPage + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Participants */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                <h3 className="font-semibold">Participants ({participants.length})</h3>
              </div>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {participant.profiles?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant.profiles?.username || "Unknown"}</span>
                    {participant.user_id === session.host_id && (
                      <Badge variant="secondary" className="ml-auto">
                        Host
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Chat */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">Chat</h3>
              </div>
              <ScrollArea className="h-[300px] mb-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-medium text-primary">
                        {msg.profiles?.username || "Unknown"}:
                      </span>
                      <p className="text-muted-foreground">{msg.message}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySession;