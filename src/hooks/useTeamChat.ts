import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import api from "@/lib/api";

export interface TeamMessage {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  type: string;
  attachments: {
    url: string;
    filename: string;
    fileType: string;
    size: number;
  }[];
  createdAt: string;
}

export const useTeamChat = (teamId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!teamId || !user) return;

    let mounted = true;

    // Load initial messages via REST fallback
    const loadMessages = async () => {
      try {
        const { data } = await api.get(`/teams/${teamId}/messages`);
        if (mounted) {
          setMessages(data.messages || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
        if (mounted) setLoading(false);
      }
    };
    loadMessages();

    // Setup Socket
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_team_room', { teamId, userId: user.id });
    });

    socket.on('team_chat_error', (data) => {
      toast.error(data.message);
    });

    socket.on('new_team_message', (msg: TeamMessage) => {
      if (mounted) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit('leave_team_room', { teamId });
        socketRef.current.disconnect();
      }
    };
  }, [teamId, user]);

  const sendMessage = useCallback(async (content: string, type: string = 'text', attachments: any[] = []) => {
    if (!socketRef.current || !socketRef.current.connected) {
      // Fallback to REST
      try {
        const { data } = await api.post(`/teams/${teamId}/messages`, { content, type, attachments });
        // The REST endpoint might return success without broadcasting if we want,
        // but typically REST would just save it. Wait, the socket on the backend does the save & broadcast.
        // If we hit REST fallback, we should add it locally.
        setMessages(prev => [...prev, data.message]);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to send message");
      }
      return;
    }

    // Send via socket
    socketRef.current.emit('send_team_message', { teamId, userId: user?.id, content, type, attachments });
  }, [teamId, user]);

  return { messages, loading, sendMessage };
};
