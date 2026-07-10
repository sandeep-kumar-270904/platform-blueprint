import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface Presence {
  id: string;
  username: string;
  avatar_url: string | null;
  status: "online" | "typing" | "viewing";
  lastSeen: string;
}

interface PresenceIndicatorProps {
  channelName: string;
  showTyping?: boolean;
}

export const PresenceIndicator = ({
  channelName,
  showTyping = true,
}: PresenceIndicatorProps) => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<Presence[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // Requires Socket.io implementation in MERN
    setPresence([]);
  }, [user, channelName]);

  const onlineCount = presence.length + 1; // +1 for current user

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        <AnimatePresence>
          {presence.slice(0, 5).map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0, x: -10 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: -10 }}
              transition={{ delay: index * 0.05 }}
            >
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-success/50">
                    <AvatarImage src={p.avatar_url || ""} />
                    <AvatarFallback className="text-xs">
                      {p.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{p.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.status === "typing"
                      ? "Typing..."
                      : p.status === "viewing"
                      ? "Viewing"
                      : "Online"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </AnimatePresence>
        {presence.length > 5 && (
          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
            <span className="text-xs font-medium">+{presence.length - 5}</span>
          </div>
        )}
      </div>

      <Badge variant="outline" className="gap-1">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        {onlineCount} online
      </Badge>

      {showTyping && typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="text-sm text-muted-foreground flex items-center gap-1"
        >
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </span>
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
          typing...
        </motion.div>
      )}
    </div>
  );
};
