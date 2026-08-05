import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageSquareOff, User, X, MoreVertical, Flag, ShieldBan, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReportUserModal } from "@/components/roommates/ReportUserModal";
import { RoommateVerificationBadge, VerificationStatus } from "@/components/roommates/RoommateVerificationBadge";
import { RoommateMeetupModal } from "@/components/roommates/RoommateMeetupModal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoommateChatWidgetProps {
  connectionId: string;
  isGroup?: boolean;
  onClose?: () => void;
  otherUser?: {
    name?: string;
    full_name?: string;
    profilePicture?: string;
    avatar_url?: string;
    _id?: string;
    verificationStatus?: VerificationStatus;
  };
}

export const RoommateChatWidget: React.FC<RoommateChatWidgetProps> = ({ connectionId, isGroup = false, onClose, otherUser }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const [reportingUser, setReportingUser] = useState<{id: string, name: string} | null>(null);

  const handleBlock = async (targetUserId: string, targetUserName: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/safety/block`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        toast({ title: "User Blocked", description: `${targetUserName} has been blocked.` });
        window.location.reload();
      } else {
        throw new Error('Failed to block');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const fetchChat = async () => {
    try {
      const endpoint = isGroup 
        ? `/api/roommates/chat/group/${connectionId}` 
        : `/api/roommates/chat/${connectionId}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChat(data);
        
        // Mark as read
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/chat/${connectionId}/read`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ isGroup })
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
  }, [connectionId]);

  useEffect(() => {
    if (!socket || !chat) return;

    const handleNewMessage = (payload: any) => {
      const matchId = isGroup ? payload.groupId : payload.connectionId;
      if (matchId === connectionId) {
        setChat((prev: any) => ({
          ...prev,
          messages: [...prev.messages, payload.message]
        }));
        
        // Optimistically mark as read if we are looking at it
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/chat/${connectionId}/read`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ isGroup })
        });
      }
    };

    const roomToJoin = isGroup ? 'roommate_group_chat' : 'roommate_chat';
    socket.emit(`join_${roomToJoin}`, connectionId);

    socket.on('roommate_message:new', handleNewMessage);
    return () => {
      socket.emit(`leave_${roomToJoin}`, connectionId);
      socket.off('roommate_message:new', handleNewMessage);
    };
  }, [socket, connectionId, chat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending || chat?.status === 'archived') return;

    setSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/chat/${connectionId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ content: message, isGroup })
      });
      
      if (res.ok) {
        setMessage('');
        // New message will come via websocket for both participants
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex flex-col h-[500px] w-full max-w-md mx-auto shadow-xl">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const displayName = otherUser?.name || otherUser?.full_name || 'Roommate';
  const displayAvatar = otherUser?.profilePicture || otherUser?.avatar_url;

  return (
    <Card className="flex flex-col h-[500px] w-full max-w-md mx-auto shadow-xl border-border bg-card overflow-hidden relative">
      <CardHeader className="p-4 border-b bg-secondary/30 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback>{isGroup ? <User className="w-5 h-5 text-muted-foreground" /> : <User className="w-5 h-5 text-muted-foreground" />}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-md font-bold">{displayName}</CardTitle>
              {!isGroup && <RoommateVerificationBadge status={otherUser?.verificationStatus || 'none'} />}
            </div>
            {chat?.status === 'archived' && (
              <Badge variant="destructive" className="mt-1 text-[10px]">Archived</Badge>
            )}
            {isGroup && chat?.participants && (
              <p className="text-xs text-muted-foreground">{chat.participants.length} members</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isGroup && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" aria-label="More options">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowMeetupModal(true)}>
                  <Calendar className="h-4 w-4 mr-2" /> Schedule Meetup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setReportingUser({ id: otherUser?._id || '', name: displayName })}>
                  <Flag className="h-4 w-4 mr-2" /> Report User
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950" onClick={() => handleBlock(otherUser?._id || '', displayName)}>
                  <ShieldBan className="h-4 w-4 mr-2" /> Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
        {chat?.messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-70">
            <MessageSquareOff className="w-10 h-10" />
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          chat?.messages?.map((msg: any, idx: number) => {
            const isMe = msg.sender._id === user?.id;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && isGroup && (
                  <Avatar className="w-6 h-6 mr-2 self-end mb-4 border border-border">
                    <AvatarImage src={msg.sender.profilePicture || msg.sender.avatar_url} />
                    <AvatarFallback><User className="w-3 h-3 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {!isMe && isGroup && (
                    <span className="text-[10px] text-muted-foreground ml-1 mb-1">{msg.sender.name || msg.sender.full_name}</span>
                  )}
                  <div 
                    className={`px-4 py-2 rounded-2xl ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <CardFooter className="p-3 border-t bg-secondary/10">
        {chat?.status === 'archived' ? (
          <div className="w-full text-center text-sm text-muted-foreground p-2 border border-dashed rounded-md bg-secondary/20">
            This connection is archived. You can no longer send messages.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex w-full gap-2">
            <Input 
              placeholder="Type a message..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              className="flex-1 bg-background"
            />
            <Button type="submit" disabled={!message.trim() || sending} size="icon">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        )}
      </CardFooter>

      {reportingUser && (
        <ReportUserModal 
          open={!!reportingUser} 
          onOpenChange={(open) => !open && setReportingUser(null)}
          targetUserId={reportingUser.id}
          targetUserName={reportingUser.name}
          contextData={{
            source: 'chat',
            chatId: chat?._id,
            recentMessages: chat?.messages?.slice(-5) // Send last 5 messages for context
          }}
        />
      )}
      {showMeetupModal && (
        <RoommateMeetupModal
          isOpen={showMeetupModal}
          onClose={() => setShowMeetupModal(false)}
          chatId={chat?._id}
        />
      )}
    </Card>
  );
};
