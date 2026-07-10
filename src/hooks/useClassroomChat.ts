import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";

export interface ClassroomMessage {
  _id?: string;
  id: string;
  classroom_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useClassroomChat = (classroomId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchAll = useCallback(async () => {
    if (!classroomId) return;
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/messages`);
      let msgs = await res.json();
      msgs = msgs.map((m: any) => ({ ...m, id: m._id }));
      setMessages(msgs);
      
      const newProfiles: Record<string, any> = {};
      msgs.forEach((m: any) => {
        if (m.profile && !newProfiles[m.user_id]) {
          newProfiles[m.user_id] = m.profile;
        }
      });
      if (Object.keys(newProfiles).length > 0) {
        setProfiles(prev => ({ ...prev, ...newProfiles }));
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => { 
    setLoading(true); 
    fetchAll(); 
  }, [fetchAll]);

  useEffect(() => {
    if (!classroomId) return;
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.emit('join_classroom', classroomId);

    newSocket.on('new_message', (msg: any) => {
      msg.id = msg._id;
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      newSocket.emit('leave_classroom', classroomId);
      newSocket.disconnect();
    };
  }, [classroomId]);

  const send = async (content: string, parentId?: string) => {
    if (!user || !classroomId || !content.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content.trim(), parent_id: parentId })
      });
      if (!res.ok) throw new Error('Send failed');
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      if (!res.ok) throw new Error('Failed to react');
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    }
  };

  const deleteMessage = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete message');
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return { messages, reactions, profiles, loading, status: 'live', send, toggleReaction, deleteMessage };
};
