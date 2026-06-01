import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface GroupInvite {
  id: string;
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
    const { data } = await supabase
      .from("study_group_invites")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    setInvites((data || []) as GroupInvite[]);
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const createInvite = async (role = "member", expiresInHours = 72, maxUses = 25) => {
    if (!user || !groupId) return null;
    const { data, error } = await supabase.rpc("create_group_invite", {
      _group_id: groupId,
      _role: role,
      _expires_in_hours: expiresInHours,
      _max_uses: maxUses,
    });
    if (error) {
      toast({ title: "Could not create invite", description: error.message, variant: "destructive" });
      return null;
    }
    await fetchInvites();
    const row = Array.isArray(data) ? data[0] : data;
    return row as { id: string; token: string; expires_at: string };
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("study_group_invites").update({ revoked: true }).eq("id", id);
    if (error) toast({ title: "Could not revoke", description: error.message, variant: "destructive" });
    else { toast({ title: "Invite revoked" }); fetchInvites(); }
  };

  return { invites, loading, createInvite, revoke, refetch: fetchInvites };
};

export const redeemInvite = async (token: string): Promise<string | null> => {
  const { data, error } = await supabase.rpc("redeem_group_invite", { _token: token });
  if (error) {
    toast({ title: "Could not join", description: error.message, variant: "destructive" });
    return null;
  }
  toast({ title: "You joined the group!" });
  return data as string;
};
