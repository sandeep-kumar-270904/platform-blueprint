import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface GroupInvite {
  id: string;
  _id?: string;
  group_id: string;
  token: string;
  role: string;
  expires_at: string;
  max_uses: number;
  uses: number;
  revoked: boolean;
  created_at: string;
  created_by: string;
}

export const useGroupInvites = (groupId: string | null) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${groupId}/invites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let data = await res.json();
        data = data.map((i: any) => ({ ...i, id: i._id }));
        setInvites(data as GroupInvite[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const createInvite = async (role = "member", expiresInHours = 72, maxUses = 25) => {
    const token = localStorage.getItem('token');
    if (!user || !groupId || !token) return null;
    
    try {
      const res = await fetch(`${API_URL}/api/study-groups/${groupId}/invites`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expires_in_hours: expiresInHours, max_uses: maxUses })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create invite');
      }
      await fetchInvites();
      const data = await res.json();
      return { id: data._id, token: data.token, expires_at: data.expires_at };
    } catch (err: any) {
      toast({ title: "Could not create invite", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const revoke = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/study-groups/invites/${id}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to revoke');
      }
      toast({ title: "Invite revoked" });
      fetchInvites();
    } catch (err: any) {
      toast({ title: "Could not revoke", description: err.message, variant: "destructive" });
    }
  };

  return { invites, loading, createInvite, revoke, refetch: fetchInvites };
};

export const redeemInvite = async (inviteToken: string): Promise<string | null> => {
  const token = localStorage.getItem('token');
  if (!token) {
    toast({ title: "Could not join", description: "Please sign in first", variant: "destructive" });
    return null;
  }
  try {
    const res = await fetch(`${API_URL}/api/study-groups/invites/redeem/${inviteToken}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to redeem');
    }
    toast({ title: "You joined the group!" });
    const groupId = await res.json();
    return groupId;
  } catch (err: any) {
    toast({ title: "Could not join", description: err.message, variant: "destructive" });
    return null;
  }
};
