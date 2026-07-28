import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface StudyGroup {
  _id: string;
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  member_limit: number;
  member_count: number;
  owner_id: string;
  last_activity?: string;
}

export interface StudyGroupUser {
  _id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  learningStreak?: { current: number };
  quizStreak?: { current: number };
}

export interface StudyGroupMembership {
  user: StudyGroupUser;
  role: 'owner' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

export interface StudyGroupResource {
  _id: string;
  title: string;
  url: string;
  added_by: { _id: string; username: string; avatar_url?: string };
  created_at: string;
}

  export interface GroupMessagePayload {
    _id: string;
    group_id: string;
    sender: { _id: string; username: string; avatar_url?: string };
    text: string;
    createdAt: string;
  }

  export interface GroupSession {
    _id: string;
    group_id: string;
    creator_id: { _id: string; username: string; avatar_url?: string };
    title: string;
    description?: string;
    format?: string;
    status: string;
    scheduled_at: string;
    duration_minutes: number;
    attendees: { _id: string; username: string; avatar_url?: string }[];
  }
  
  export interface StudyGroupDetailType extends StudyGroup {
    memberships: StudyGroupMembership[];
    resources: StudyGroupResource[];
  }

export const useStudyGroups = () => {
  const { user } = useAuth();
  
  // Split state
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<StudyGroup[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [loadingMyGroups, setLoadingMyGroups] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [status, setStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  // Debounce logic for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchMyGroups = useCallback(async () => {
    try {
      const res = await api.get('/study-groups/my-memberships');
      setMyGroups(res.data);
    } catch (error) {
      console.error('Error fetching my groups:', error);
      setStatus('error');
    } finally {
      setLoadingMyGroups(false);
    }
  }, []);

  const fetchDiscoverGroups = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoadingDiscover(true);
      const queryParams = new URLSearchParams();
      if (user) {
        queryParams.append('excludeUserId', user.id);
      }
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) queryParams.append(k, v);
        });
      }
      
      const res = await api.get(`/study-groups?${queryParams.toString()}`);
      
      // Update logic to handle object payload from Phase 6
      if (res.data && Array.isArray(res.data.discoverGroups)) {
        setDiscoverGroups(res.data.discoverGroups);
        setRecommendedGroups(res.data.recommendedGroups || []);
      } else {
        // Fallback if backend wasn't updated
        setDiscoverGroups(Array.isArray(res.data) ? res.data : []);
        setRecommendedGroups([]);
      }
      
      setStatus('synced');
    } catch (error) {
      console.error('Error fetching discover groups:', error);
      setStatus('error');
    } finally {
      setLoadingDiscover(false);
    }
  }, [user]);

  // Initial fetch and on debounce change
  useEffect(() => {
    fetchMyGroups();
  }, [fetchMyGroups]);

  useEffect(() => {
    fetchDiscoverGroups();
  }, [fetchDiscoverGroups]);

  const createGroup = async (payload: Partial<StudyGroup>) => {
    if (!user) return toast.error("Sign in required");
    try {
      setStatus('syncing');
      const res = await api.post('/study-groups', payload);
      toast.success("Group created successfully!");
      
      // Re-fetch both lists
      await fetchMyGroups();
      await fetchDiscoverGroups();
      
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create group');
      setStatus('connected');
      throw err; // Re-throw to allow component to handle failure
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return toast.error("Sign in required");
    try {
      setStatus('syncing');
      const res = await api.post(`/study-groups/${groupId}/join`);
      toast.success(res.data.message || "Action successful");
      
      // Re-fetch both lists so the group moves from Discover to My Groups instantly
      await fetchMyGroups();
      await fetchDiscoverGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to join group');
      setStatus('connected');
    }
  };

  const fetchGroupDetail = async (groupId: string): Promise<StudyGroupDetailType> => {
    const res = await api.get(`/study-groups/${groupId}`);
    return res.data;
  };

  const manageMembership = async (groupId: string, userId: string, status: 'active' | 'rejected') => {
    const res = await api.put(`/study-groups/${groupId}/memberships/${userId}`, { status });
    toast.success(status === 'active' ? "Member approved" : "Request denied");
    return res.data;
  };

  const leaveGroup = async (groupId: string) => {
    await api.post(`/study-groups/${groupId}/leave`);
    toast.success("You left the group");
    fetchMyGroups();
  };

  const deleteGroup = async (groupId: string) => {
    await api.delete(`/study-groups/${groupId}`);
    toast.success("Group deleted");
    fetchMyGroups();
  };

  const addResource = async (groupId: string, payload: { title: string; url: string }) => {
    const res = await api.post(`/study-groups/${groupId}/resources`, payload);
    toast.success("Resource added");
    return res.data;
  };

  const deleteResource = async (groupId: string, resourceId: string) => {
    await api.delete(`/study-groups/${groupId}/resources/${resourceId}`);
    toast.success("Resource deleted");
  };

  const fetchMessages = async (groupId: string, skip = 0, limit = 50): Promise<GroupMessagePayload[]> => {
    const res = await api.get(`/study-groups/${groupId}/messages?skip=${skip}&limit=${limit}`);
    return res.data;
  };

  const sendMessage = async (groupId: string, text: string): Promise<GroupMessagePayload> => {
    const res = await api.post(`/study-groups/${groupId}/messages`, { text });
    return res.data;
  };

  const fetchSessions = async (groupId: string) => {
    const res = await api.get(`/study-groups/${groupId}/sessions`);
    return res.data as { upcoming: GroupSession[], past: GroupSession[] };
  };

  const createSession = async (groupId: string, payload: Partial<GroupSession>) => {
    const res = await api.post(`/study-groups/${groupId}/sessions`, payload);
    toast.success("Session scheduled!");
    return res.data;
  };

  const updateSession = async (groupId: string, sessionId: string, payload: Partial<GroupSession>) => {
    const res = await api.put(`/study-groups/${groupId}/sessions/${sessionId}`, payload);
    toast.success("Session updated");
    return res.data;
  };

  const deleteSession = async (groupId: string, sessionId: string) => {
    await api.delete(`/study-groups/${groupId}/sessions/${sessionId}`);
    toast.success("Session cancelled");
  };

  const rsvpSession = async (groupId: string, sessionId: string) => {
    const res = await api.post(`/study-groups/${groupId}/sessions/${sessionId}/rsvp`);
    toast.success("RSVP updated");
    return res.data;
  };

  return { 
    myGroups, 
    discoverGroups, 
    loadingMyGroups,
    loadingDiscover,
    searchQuery,
    setSearchQuery,
    status, 
    createGroup, 
    joinGroup,
    fetchGroupDetail,
    manageMembership,
    leaveGroup,
    deleteGroup,
    addResource,
    deleteResource,
    fetchMessages,
    sendMessage,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    rsvpSession,
    refetch: () => {
      fetchMyGroups();
      fetchDiscoverGroups();
    }
  };
};
