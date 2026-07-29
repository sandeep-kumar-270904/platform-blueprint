import { useState, useEffect, useRef, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string | null;
}

interface PresenceUser {
  id: string;
  username: string;
  status: "online" | "typing";
}

interface IdeaLiveChatProps {
  ideaId: string;
}

export const IdeaLiveChat = ({ ideaId }: IdeaLiveChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifCooldownRef = useRef<Record<string, number>>({});
  const channelRef = useRef<any>(null);
  const lastSendRef = useRef<number>(0);
  const lastTypingRef = useRef<number>(0);

  // Profile cache to avoid re-fetching
  const profileCache = useRef<Record<string, string>>({});

  const getUsername = useCallback(async (userId: string): Promise<string> => {
    if (profileCache.current[userId]) return profileCache.current[userId];
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        const name = data?.username || "Anonymous";
        profileCache.current[userId] = name;
        return name;
      }
    } catch {}
    return "Anonymous";
  }, []);

  // Load existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/innovation/ideas/${ideaId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }
      setLoading(false);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [ideaId]);

  // Presence and typing mock interval for UI
  useEffect(() => {
    // In a full MERN, this would be Socket.io. For now, empty online users.
    setOnlineUsers([]);
  }, [user, ideaId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const broadcastTyping = useCallback(() => {
    // Requires Socket.io in MERN, no-op for polling
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    broadcastTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    const now = Date.now();
    if (now - lastSendRef.current < 500) return; // Rate limit: 500ms between sends
    lastSendRef.current = now;
    const content = newMessage.trim();
    if (content.length > 1000) { toast.error("Message too long (max 1000 chars)"); return; }
    setNewMessage("");
    setSending(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/ideas/${ideaId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        toast.error("Failed to send message");
        setNewMessage(content);
      }
    } catch {
      toast.error("Failed to send message");
      setNewMessage(content);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onlineCount = onlineUsers.length;

  return (
    <div className="flex flex-col h-[350px] border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Live Chat</span>
        </div>
        <div className="flex items-center gap-2">
          {onlineCount > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {onlineCount} online
            </Badge>
          )}
          <div className="flex -space-x-1.5">
            {onlineUsers.slice(0, 4).map((u) => (
              <Avatar key={u.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {u.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {onlineUsers.length > 4 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-[9px] font-medium">+{onlineUsers.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {(msg.username || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                      <div className={`flex items-center gap-1.5 ${isOwn ? "justify-end" : ""}`}>
                        <span className="text-xs font-medium">{msg.username || "User"}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div
                        className={`mt-0.5 text-sm px-3 py-1.5 rounded-xl inline-block ${
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground flex items-center gap-1">
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full bg-muted-foreground"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </span>
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Input */}
      <div className="p-2.5 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={user ? "Type a message..." : "Sign in to chat"}
            className="flex-1 h-9 text-sm"
            disabled={!user}
            maxLength={1000}
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !user || sending}
            className="h-9 w-9 p-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
