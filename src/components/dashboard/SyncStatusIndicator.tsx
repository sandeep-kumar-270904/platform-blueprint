import { Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SyncStatus } from "@/hooks/useRealtimeSync";

interface Props {
  status: SyncStatus;
  className?: string;
}

const meta: Record<string, { label: string; tip: string; icon: typeof Wifi; color: string; dot: string }> = {
  connecting: {
    label: "Connecting",
    tip: "Establishing real-time connection…",
    icon: Loader2,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  live: {
    label: "Live",
    tip: "Real-time sync active. Updates appear instantly.",
    icon: Wifi,
    color: "text-green-600",
    dot: "bg-green-500 animate-pulse",
  },
  polling: {
    label: "Polling",
    tip: "Real-time unavailable — falling back to periodic refresh.",
    icon: RefreshCw,
    color: "text-amber-600",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Reconnecting",
    tip: "Connection dropped. Reconnecting...",
    icon: WifiOff,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  error: {
    label: "Offline",
    tip: "Sync unavailable. Reconnecting…",
    icon: WifiOff,
    color: "text-red-600",
    dot: "bg-red-500",
  },
};

export const SyncStatusIndicator = ({ status, className = "" }: Props) => {
  const m = meta[status] || meta["error"]; // fallback to error/offline if unknown status
  const Icon = m.icon;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-testid="sync-status"
            data-status={status}
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/60 bg-background/60 text-xs font-medium ${m.color} ${className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
            <Icon className={`h-3 w-3 ${status === "connecting" ? "animate-spin" : ""}`} />
            <span>{m.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{m.tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
