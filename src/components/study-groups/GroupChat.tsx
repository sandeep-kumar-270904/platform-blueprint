import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { useStudyGroups, GroupMessagePayload } from '@/hooks/useStudyGroups';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Send, WifiOff, AlertCircle, Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';

interface GroupChatProps {
  groupId: string;
}

const GroupChat: React.FC<GroupChatProps> = ({ groupId }) => {
  const { user } = useAuth();
  const { fetchMessages, sendMessage } = useStudyGroups();
  
  const [messages, setMessages] = useState<GroupMessagePayload[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // States for sending/failed
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  
  // Reporting
  const [reportTarget, setReportTarget] = useState<{id: string, name?: string} | null>(null);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  // Connection state
  const [isConnected, setIsConnected] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await fetchMessages(groupId);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };
    loadHistory();
  }, [groupId]);

  // Socket setup
  useEffect(() => {
    if (!user) return;
    
    // Connect to global socket (assuming backend runs on standard port or relative path)
    const socket = io(); // Connects to host
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_group_room', { groupId, userId: user.id || user._id });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_group_message', (msg: GroupMessagePayload) => {
      setMessages(prev => {
        // Prevent duplicate if we sent it and it broadcasted back (though usually we don't render optimistically to avoid this, or we match IDs)
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Also clear typing if they sent a message
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(msg.sender.username);
        return next;
      });
      scrollToBottom();
    });

    socket.on('group_typing', ({ username }) => {
      if (username === user.username) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.add(username);
        return next;
      });
    });

    socket.on('group_stop_typing', ({ username }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    });

    return () => {
      socket.emit('leave_group_room', groupId);
      socket.disconnect();
    };
  }, [groupId, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    if (socketRef.current && user) {
      socketRef.current.emit('group_typing', { groupId, username: user.username });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('group_stop_typing', { groupId, username: user.username });
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText.trim();
    setInputText('');
    
    if (socketRef.current && user) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('group_stop_typing', { groupId, username: user.username });
    }

    // Optimistic temp ID
    const tempId = Date.now().toString();
    const tempMsg: GroupMessagePayload = {
      _id: tempId,
      group_id: groupId,
      sender: { _id: user.id || user._id, username: user.username, avatar_url: user.avatar_url },
      text: textToSend,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setSendingIds(prev => new Set(prev).add(tempId));
    scrollToBottom();

    try {
      const savedMsg = await sendMessage(groupId, textToSend);
      // Replace temp msg with real one
      setMessages(prev => prev.map(m => m._id === tempId ? savedMsg : m));
    } catch (err) {
      console.error("Message send failed");
      setFailedIds(prev => new Set(prev).add(tempId));
    } finally {
      setSendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 border rounded-lg bg-card">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] md:h-[600px] border rounded-lg bg-card overflow-hidden relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-red-500/10 text-red-500 text-xs py-1 px-3 flex items-center justify-center gap-2 z-10" role="alert">
          <WifiOff className="w-3 h-3" aria-hidden="true" /> Connection lost. Retrying...
        </div>
      )}
      
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" aria-live="polite" aria-atomic="false">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm">Say hello to your study group!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender.username === user?.username;
            const isSending = sendingIds.has(msg._id);
            const isFailed = failedIds.has(msg._id);
            const showAvatar = index === 0 || messages[index - 1].sender._id !== msg.sender._id;

            return (
              <div key={msg._id} className={`flex gap-3 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {showAvatar ? (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={msg.sender.avatar_url} />
                    <AvatarFallback>{msg.sender.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 shrink-0" />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%] relative`}>
                  {showAvatar && (
                    <span className="text-xs text-muted-foreground mb-1 ml-1 mr-1">
                      {isMe ? 'You' : msg.sender.username}
                    </span>
                  )}
                  
                  <div className={`px-4 py-2 rounded-2xl relative ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                    
                    {!isMe && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-10 top-0 h-8 w-8 opacity-0 group-hover/msg:opacity-100 transition-opacity text-muted-foreground hover:text-orange-500"
                        onClick={() => setReportTarget({ id: msg._id, name: msg.text.slice(0, 30) + (msg.text.length > 30 ? '...' : '') })}
                        aria-label="Report Message"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 mx-1 text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isSending && <Loader2 className="w-3 h-3 animate-spin" />}
                    {isFailed && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Failed</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground italic bg-background/50 backdrop-blur-sm border-t border-b">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <div className="relative">
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <textarea
            id="chat-input"
            value={inputText}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            aria-label="Type a message"
            className="w-full resize-none rounded-lg border bg-background px-4 py-3 pr-12 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[50px] max-h-[150px]"
            rows={1}
            disabled={!isConnected}
          />
          <Button 
            size="icon" 
            className="absolute right-2 top-2 h-8 w-8" 
            onClick={handleSend}
            disabled={!inputText.trim() || !isConnected}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {reportTarget && (
        <ReportModal 
          isOpen={!!reportTarget} 
          onClose={() => setReportTarget(null)} 
          targetType="message"
          targetId={reportTarget.id}
          targetName={reportTarget.name}
          groupId={groupId}
        />
      )}
    </div>
  );
};

export default GroupChat;
