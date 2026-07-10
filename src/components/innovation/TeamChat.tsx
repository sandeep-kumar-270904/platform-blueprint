import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Smile, MoreVertical, Reply, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  user_id: string;
  created_at: string;
  is_read: boolean;
  reply_to: string | null;
  user?: {
    username: string;
    avatar_url: string;
  };
}

interface TeamChatProps {
  teamId: string;
}

export const TeamChat = ({ teamId }: TeamChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!teamId || !user) return;

    const fetchMessages = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/innovation/teams/${teamId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {}
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [teamId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !teamId) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/teams/${teamId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          message_type: "text",
          reply_to: replyTo?.id || null,
        })
      });

      if (res.ok) {
        setNewMessage("");
        setReplyTo(null);
      }
    } catch {}
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "file":
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Team Chat</h3>
          <div className="flex items-center gap-2">
            {isTyping.length > 0 && (
              <p className="text-xs text-muted-foreground animate-pulse">
                {isTyping.join(", ")} typing...
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwn = message.user_id === user?.id;
              const showAvatar =
                index === 0 || messages[index - 1]?.user_id !== message.user_id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {showAvatar ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.user?.avatar_url || ""} />
                      <AvatarFallback>
                        {message.user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" />
                  )}
                  <div
                    className={`max-w-[70%] ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    {showAvatar && (
                      <p
                        className={`text-xs text-muted-foreground mb-1 ${
                          isOwn ? "text-right" : ""
                        }`}
                      >
                        {message.user?.username || "Anonymous"}
                      </p>
                    )}
                    {message.reply_to && (
                      <div className="text-xs bg-muted/50 p-2 rounded-t-lg border-l-2 border-primary mb-1">
                        Replying to a message
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-lg ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.file_url && (
                        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
                          {getMessageTypeIcon(message.message_type)}
                          <span>Attachment</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 mt-1 ${
                        isOwn ? "justify-end" : ""
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={() => setReplyTo(message)}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Reply indicator */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-t bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Replying to{" "}
                  <span className="font-medium">
                    {replyTo.user?.username || "message"}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setReplyTo(null)}
              >
                ×
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button variant="ghost" size="icon">
            <Smile className="h-4 w-4" />
          </Button>
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
