import { useState, useRef, useEffect } from "react";
import { useClassroomChat } from "@/hooks/useClassroomChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, SmilePlus, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const EMOJI_PALETTE = ["👍", "❤️", "🎉", "🔥", "😂", "🙌", "💡", "🤔"];

export const ClassroomChat = ({ classroomId }: { classroomId: string }) => {
  const { user } = useAuth();
  const { messages, reactions, profiles, loading, send, toggleReaction, deleteMessage } = useClassroomChat(classroomId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await send(input);
    setInput("");
  };

  const reactionsFor = (mid: string) => {
    const grouped: Record<string, { count: number; mine: boolean }> = {};
    reactions.filter((r) => r.message_id === mid).forEach((r) => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
      grouped[r.emoji].count += 1;
      if (r.user_id === user?.id) grouped[r.emoji].mine = true;
    });
    return grouped;
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-card">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Classroom Chat</h3>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length} messages</span>
      </div>
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-8">Be the first to say hello 👋</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const p = profiles[m.user_id];
              const name = p?.full_name || "Member";
              const initials = name.split(" ").map((s: string) => s[0]).slice(0, 2).join("");
              const rx = reactionsFor(m.id);
              const isMine = m.user_id === user?.id;
              return (
                <div key={m.id} className="group flex gap-2 items-start">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold">{name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm break-words whitespace-pre-wrap">{m.content}</p>
                    <div className="flex flex-wrap gap-1 mt-1 items-center">
                      {Object.entries(rx).map(([emoji, info]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(m.id, emoji)}
                          className={`text-xs px-1.5 py-0.5 rounded-full border ${info.mine ? "bg-primary/10 border-primary/40" : "border-border"} hover:bg-muted transition`}
                        >
                          {emoji} {info.count}
                        </button>
                      ))}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5">
                            <SmilePlus className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1" align="start">
                          <div className="flex gap-1">
                            {EMOJI_PALETTE.map((e) => (
                              <button key={e} className="text-lg hover:bg-muted rounded p-1" onClick={() => toggleReaction(m.id, e)}>{e}</button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {isMine && (
                        <button onClick={() => deleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <div className="border-t p-2 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={user ? "Type a message..." : "Sign in to chat"}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={!user}
        />
        <Button size="icon" onClick={handleSend} disabled={!user || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
