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
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  const fetchAll = useCallback(async () => {
    try {
      setStatus('syncing');
      
      const [groupsRes, membershipsRes] = await Promise.all([
        api.get('/study-groups'),
        user ? api.get('/study-groups/my-memberships') : Promise.resolve({ data: [] })
      ]);

      setGroups(groupsRes.data);
      setMyGroupIds(new Set(membershipsRes.data));
      setStatus('connected');
    } catch (err) {
      console.error('Error fetching groups:', err);
      setStatus('offline');
      toast.error('Failed to load study groups');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createGroup = async (payload: Partial<StudyGroup>) => {
    if (!user) return toast.error("Sign in required");
    try {
      setStatus('syncing');
      const res = await api.post('/study-groups', payload);
      toast.success("Group created successfully!");
      // Re-fetch to update state
      await fetchAll();
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create group');
      setStatus('connected');
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return toast.error("Sign in required");
    try {
      setStatus('syncing');
      const res = await api.post(`/study-groups/${groupId}/join`);
      toast.success(res.data.message || "Action successful");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to join group');
      setStatus('connected');
    }
  };

  return { 
    groups, 
    myGroupIds, 
    loading, 
    status, 
    createGroup, 
    joinGroup,
    refetch: fetchAll
  };
};
