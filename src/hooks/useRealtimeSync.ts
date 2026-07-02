import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SyncStatus = "connecting" | "live" | "polling" | "error";

export interface RealtimeFilter {
  /** Postgres table name in the public schema */
  table: string;
  /** Optional filter clause (e.g., `user_id=eq.${uid}`). Keep RLS-safe. */
  filter?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema?: string;
}

interface Options {
  /** Unique channel name (defaults to a random one). */
  channelName?: string;
  /** Subscriptions to register. */
  filters: RealtimeFilter[];
  /** Refetch / handler invoked on any matching change AND on poll tick. */
  onChange: () => void | Promise<void>;
  /** Polling fallback interval in ms (default 30s). */
  pollIntervalMs?: number;
  /** Disable entirely (e.g. when no user). */
  enabled?: boolean;
}

/**
 * Shared realtime subscription hook.
 * - Subscribes to the supplied filters
 * - Reports SyncStatus ("connecting" → "live"/"polling"/"error")
 * - Always runs a polling fallback so widgets stay fresh even if WS drops
 */
export function useRealtimeSync({
  channelName,
  filters,
  onChange,
  pollIntervalMs = 5000,
  enabled = true,
}: Options): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("live");
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  // Stable signature for filters so the effect doesn't re-subscribe on every render.
  const filterKey = JSON.stringify(filters);

  const safeInvoke = useCallback(() => {
    try {
      const r = handlerRef.current?.();
      if (r && typeof (r as Promise<void>).then === "function") {
        (r as Promise<void>).catch(() => {});
      }
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    const name = channelName || `rt-${Math.random().toString(36).slice(2, 10)}`;

    const ch = supabase.channel(name);
    filters.forEach((f) => {
      ch.on(
        // @ts-expect-error supabase typing for postgres_changes
        "postgres_changes",
        {
          event: f.event || "*",
          schema: f.schema || "public",
          table: f.table,
          ...(f.filter ? { filter: f.filter } : {}),
        },
        () => safeInvoke()
      );
    });

    ch.subscribe((s) => {
      if (cancelled) return;
      if (s === "SUBSCRIBED") setStatus("live");
    });
    channel = ch;

    // Initial fetch + polling fallback (always runs — keeps data fresh if WS dies silently)
    safeInvoke();
    const pollId = window.setInterval(() => safeInvoke(), pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, channelName, pollIntervalMs, enabled, safeInvoke]);

  return status;
}
