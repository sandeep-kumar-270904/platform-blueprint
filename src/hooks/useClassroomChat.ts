import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ClassroomMessage {
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

export const useClassroomChat = (classroomId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!classroomId) return;
    const { data: msgs } = await supabase
      .from("classroom_messages")
      .select("*")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: true })
      .limit(500);
    setMessages((msgs || []) as ClassroomMessage[]);
    const ids = (msgs || []).map((m: any) => m.id);
    if (ids.length) {
      const { data: rx } = await supabase.from("classroom_message_reactions").select("*").in("message_id", ids);
      setReactions((rx || []) as MessageReaction[]);
    } else {
      setReactions([]);
    }
    const userIds = Array.from(new Set((msgs || []).map((m: any) => m.user_id)));
    if (userIds.length) {
      const { data: pr } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const map: Record<string, any> = {};
      (pr || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, [classroomId]);

  useEffect(() => { setLoading(true); fetchAll(); }, [fetchAll]);

  const status = useRealtimeSync({
    channelName: `classroom-chat-${classroomId || "none"}`,
    enabled: !!classroomId,
    filters: classroomId
      ? [
          { table: "classroom_messages", filter: `classroom_id=eq.${classroomId}` },
          { table: "classroom_message_reactions" },
        ]
      : [],
    onChange: fetchAll,
  });

  const send = async (content: string, parentId?: string) => {
    if (!user || !classroomId || !content.trim()) return;
    const { error } = await supabase.from("classroom_messages").insert({
      classroom_id: classroomId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    });
    if (error) toast({ title: "Send failed", description: error.message, variant: "destructive" });
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.rpc("toggle_classroom_reaction", { _message_id: messageId, _emoji: emoji });
    if (error) toast({ title: "Reaction failed", description: error.message, variant: "destructive" });
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("classroom_messages").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
  };

  return { messages, reactions, profiles, loading, status, send, toggleReaction, deleteMessage };
};
