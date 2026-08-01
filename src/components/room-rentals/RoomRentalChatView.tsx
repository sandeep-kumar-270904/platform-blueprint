import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';

interface RoomRentalChatViewProps {
  roomId: string;
  recipientId: string;
}

export function RoomRentalChatView({ roomId, recipientId }: RoomRentalChatViewProps) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chat, isLoading } = useQuery({
    queryKey: ['room-rental-chat', roomId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/room-rental-chats/${roomId}`);
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) return null; // Chat doesn't exist yet
        throw err;
      }
    },
    refetchInterval: 5000 // Simple polling for now
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/room-rental-chats/${roomId}`, {
        content: newMessage,
        recipientId
      });
      return data;
    },
    onSuccess: (newMsg) => {
      setNewMessage('');
      queryClient.setQueryData(['room-rental-chat', roomId], (old: any) => {
        if (!old) return { messages: [newMsg] };
        return { ...old, messages: [...old.messages, newMsg] };
      });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to send message');
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage.mutate();
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-md bg-background">
      <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : !chat || !chat.messages || chat.messages.length === 0 ? (
          <div className="text-center text-muted-foreground pt-10">No messages yet. Send a message to start the conversation!</div>
        ) : (
          chat.messages.map((msg: any, i: number) => {
            const isMe = msg.sender._id !== recipientId;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-[10px] opacity-70 block mt-1">
                    {format(new Date(msg.timestamp), 'h:mm a')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-3 border-t bg-muted/30">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendMessage.isPending}
          />
          <Button type="submit" disabled={sendMessage.isPending || !newMessage.trim()}>
            {sendMessage.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
