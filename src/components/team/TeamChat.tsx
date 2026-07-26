import { useState, useRef, useEffect } from "react";
import { useTeamChat } from "@/hooks/useTeamChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, Loader2, Paperclip, Video, FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useStartCall, useUploadTeamMessageFile } from "@/hooks/useTeams";
import { toast } from "sonner";

export const TeamChat = ({ teamId }: { teamId: string }) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useTeamChat(teamId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = useUploadTeamMessageFile();
  const startCallMutation = useStartCall();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input, 'text', []);
    setInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadMutation.mutateAsync({ teamId, file });
      await sendMessage(result.filename, 'file', [result]);
    } catch (err) {
      toast.error("Failed to upload file");
    }
  };

  const handleStartMeeting = async () => {
    if (!meetingLink.trim()) return;
    try {
      await startCallMutation.mutateAsync({ teamId, external_video_url: meetingLink });
      await sendMessage(`Started a meeting: ${meetingLink}`, 'system', []);
      setIsCallModalOpen(false);
      setMeetingLink("");
    } catch (err) {
      toast.error("Failed to start meeting");
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-card">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Team Chat</h3>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length} messages</span>
        
        <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2 gap-1 h-8">
              <Video className="h-3.5 w-3.5" /> Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Meeting Link (Zoom, Google Meet, etc.)</Label>
                <Input 
                  placeholder="https://..." 
                  value={meetingLink} 
                  onChange={e => setMeetingLink(e.target.value)} 
                />
              </div>
              <Button onClick={handleStartMeeting} className="w-full" disabled={startCallMutation.isPending || !meetingLink.trim()}>
                {startCallMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Broadcast Meeting Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-8">Say hello to your team! 👋</p>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => {
              const senderName = m.sender?.full_name || m.sender?.username || "Unknown User";
              const initials = senderName.split(" ").map(s => s[0]).slice(0, 2).join("");
              
              const isSystem = m.type === 'system';

              if (isSystem) {
                return (
                  <div key={m._id} className="flex justify-center my-2">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {m.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={m._id} className="group flex gap-3 items-start">
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarImage src={m.sender?.avatar_url} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 bg-muted/40 p-3 rounded-lg rounded-tl-none">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold">{senderName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {m.type === 'file' && m.attachments && m.attachments.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {m.attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                            {att.fileType?.startsWith('image/') ? (
                              <img src={att.url} alt="attachment" className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            )}
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{att.filename}</p>
                              <p className="text-xs text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={att.url} download={att.filename} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm break-words whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <div className="border-t p-3 flex gap-2 bg-muted/20 items-center">
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={!user || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4 text-muted-foreground" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={user ? "Type a message..." : "Sign in to chat"}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={!user}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!user || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
