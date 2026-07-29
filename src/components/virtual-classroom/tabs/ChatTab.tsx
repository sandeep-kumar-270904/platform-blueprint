import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Lock, Shield, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  timestamp: string;
  isPrivate: boolean;
}

export const ChatTab = ({ classroomId, isHost, socket, chatMode }: { classroomId: string, isHost: boolean, socket: any, chatMode: string }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('chat_message_received', (msg: ChatMessage) => {
      // Only show private messages if user is sender or user is host
      if (msg.isPrivate && !isHost && msg.senderId !== user?.id) return;
      setMessages(prev => [...prev, msg]);
    });

    socket.on('chat_message_deleted', (msgId: string) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
    });

    return () => {
      socket.off('chat_message_received');
      socket.off('chat_message_deleted');
    };
  }, [socket, isHost, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !user) return;

    // Check permissions
    if (!isHost) {
      if (chatMode === 'disabled') return;
      if (chatMode === 'hosts_only' && !isPrivate) return; // Can only send private to host
    }

    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: user.user_metadata?.full_name || user.email?.split('@')[0] || "Student",
      senderId: user.id,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPrivate: isPrivate
    };

    socket.emit('send_chat_message', { roomId: classroomId, message: msg });
    setInputText("");
  };

  const deleteMessage = (id: string) => {
    if (!isHost || !socket) return;
    socket.emit('delete_chat_message', { roomId: classroomId, messageId: id });
  };

  const canChat = isHost || chatMode === 'everyone' || (chatMode === 'hosts_only' && isPrivate);
  const placeholderText = chatMode === 'disabled' && !isHost 
    ? "Chat is disabled" 
    : chatMode === 'hosts_only' && !isHost && !isPrivate
      ? "Chat is hosts only (check 'Direct to Host')"
      : "Type a message...";

  return (
    <div className="flex flex-col h-full h-[calc(100vh-140px)]">
      {chatMode !== 'everyone' && (
        <div className="bg-orange-500/10 text-orange-600 text-xs p-2 mb-2 rounded flex items-center gap-2">
          {chatMode === 'disabled' ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          {chatMode === 'disabled' ? "Chat is disabled for attendees." : "Attendees can only message hosts."}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 p-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-10">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
            No messages yet.
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="group">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm flex items-center gap-1">
                  {msg.sender}
                  {msg.isPrivate && <Badge variant="outline" className="text-[10px] h-4 py-0 bg-primary/10">Private</Badge>}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  {isHost && (
                    <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-red-700 transition">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm bg-muted/30 p-2 rounded mt-1 break-words">
                {msg.text}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="mt-4 pt-2 border-t shrink-0">
        {!isHost && chatMode !== 'disabled' && (
          <div className="flex items-center gap-2 mb-2">
            <input 
              type="checkbox" 
              id="isPrivate" 
              checked={isPrivate} 
              onChange={e => setIsPrivate(e.target.checked)} 
              className="rounded"
              disabled={chatMode === 'hosts_only'} // Forced private if hosts_only
            />
            <label htmlFor="isPrivate" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
              <Shield className="h-3 w-3" /> Direct message to Host
            </label>
          </div>
        )}
        <div className="flex gap-2">
          <Input 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={placeholderText}
            className="flex-1"
            disabled={!canChat}
          />
          <Button type="submit" size="icon" disabled={!canChat || !inputText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

// Quick shim for Badge to avoid importing if not strictly needed in this context, or we can use generic div
const Badge = ({ children, className }: any) => (
  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${className}`}>
    {children}
  </span>
);
