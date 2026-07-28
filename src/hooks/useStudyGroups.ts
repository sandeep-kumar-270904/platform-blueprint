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
    if (!user) {
      setMyGroups([]);
      setLoadingMyGroups(false);
      return;
    }
    try {
      setStatus('syncing');
      const res = await api.get('/study-groups/my-memberships');
      setMyGroups(res.data);
      setStatus('connected');
    } catch (err) {
      console.error('Error fetching my groups:', err);
      setStatus('offline');
    } finally {
      setLoadingMyGroups(false);
    }
  }, [user]);

  const fetchDiscoverGroups = useCallback(async () => {
    try {
      setStatus('syncing');
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (user) params.append('excludeUserId', user.id);

      const res = await api.get(`/study-groups?${params.toString()}`);
      setDiscoverGroups(res.data);
      setStatus('connected');
    } catch (err) {
      console.error('Error fetching discover groups:', err);
      setStatus('offline');
    } finally {
      setLoadingDiscover(false);
    }
  }, [user, debouncedSearch]);

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
    refetch: () => {
      fetchMyGroups();
      fetchDiscoverGroups();
    }
  };
};
