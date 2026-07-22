import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface StudyGroupRow {
  id: string;
  _id?: string;
  owner_id: string;
  name: string;
  description: string;
  privacy: string;
  category: string | null;
  member_limit: number;
  member_count: number;
  active_room_count: number;
  banner_url: string | null;
  pending_members?: any[];
  shared_resources?: any[];
  active_challenge_id?: string | null;
  members?: any[];
}

export interface GroupMessage {
  id: string;
  _id?: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  createdAt?: string;
}

export const useStudyGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroupRow[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('live');

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/study-groups`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((g: any) => ({ ...g, id: g._id, created_at: g.createdAt }));
        setGroups(data);
      }
      
      const token = localStorage.getItem('token');
      if (token && user) {
        const memRes = await fetch(`${API_URL}/api/study-groups/my-memberships`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (memRes.ok) {
          const myIds = await memRes.json();
          setMyGroupIds(new Set(myIds));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchAll();

    const socket = io(API_URL);
    socket.on('study_group_created', () => fetchAll());
    socket.on('study_group_updated', () => fetchAll());

    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  const join = async (gid: string) => {
    const token = localStorage.getItem('token');
    if (!token) return toast.error("Sign in required");
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to join');
      }
      toast.success("Joined group");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const leave = async (gid: string) => {
    const token = localStorage.getItem('token');
    if (!token) return toast.error("Sign in required");
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to leave');
      }
      toast.success("Left group");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const createGroup = async (payload: Partial<StudyGroupRow>) => {
    const token = localStorage.getItem('token');
    if (!token) return toast.error("Sign in required");
    try {
      const res = await fetch(`${API_URL}/api/study-groups`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create group');
      }
      toast.success("Group created");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchGroupDetails = async (gid: string) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch details');
      return await res.json();
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  const fetchGroupProgress = async (gid: string) => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch progress');
      return await res.json();
    } catch (err: any) {
      toast.error(err.message);
      return [];
    }
  };

  const addResource = async (gid: string, title: string, url: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/resources`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url })
      });
      if (!res.ok) throw new Error('Failed to add resource');
      toast.success('Resource added');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeResource = async (gid: string, resId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/resources/${resId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove resource');
      toast.success('Resource removed');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const requestToJoin = async (gid: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/requests`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to send request');
      toast.success('Request sent');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const approveRequest = async (gid: string, userId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/requests/${userId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve request');
      toast.success('Member approved');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeMember = async (gid: string, userId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${gid}/members/${userId}/remove`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove member');
      toast.success('Member removed');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return { 
    groups, myGroupIds, loading, status, 
    join, leave, createGroup, refetch: fetchAll,
    fetchGroupDetails, fetchGroupProgress, addResource, removeResource,
    requestToJoin, approveRequest, removeMember
  };
};

export const useGroupMessages = (groupId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);

  const fetchMsgs = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${groupId}/messages`);
      if (res.ok) {
        let data = await res.json();
        data = data.map((m: any) => ({ ...m, id: m._id, created_at: m.createdAt || m.created_at }));
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    fetchMsgs();

    const socket = io(API_URL);
    socket.emit('join_group_room', groupId);
    
    socket.on('group_message', (newMsg: any) => {
      const formatted = { ...newMsg, id: newMsg._id, created_at: newMsg.createdAt || newMsg.created_at };
      setMessages(prev => [...prev, formatted]);
    });

    return () => {
      socket.emit('leave_group_room', groupId);
      socket.disconnect();
    };
  }, [groupId, fetchMsgs]);

  const send = async (content: string) => {
    const token = localStorage.getItem('token');
    if (!token || !groupId || !content.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() })
      });
      if (!res.ok) throw new Error('Failed to send message');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return { messages, send };
};
