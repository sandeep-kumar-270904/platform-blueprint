import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AITab = ({ classroomId, isHost }: { classroomId: string, isHost: boolean }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi! I am your classroom AI assistant. Ask me to summarize what you missed, clarify a topic, or define a term!' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI response for the live assistant
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on the live transcript, here is a response to: "${newMsg.content}". (This is a simulated AI response; connect to edge function for real generation).`
      }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h4 className="font-medium text-sm flex items-center gap-2"><Bot className="h-4 w-4 text-blue-500"/> AI Classroom Assistant</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Private to you. Ask questions without interrupting the host.
        </p>
      </div>

      <ScrollArea className="flex-1 pr-4 -mr-4 border rounded-md bg-muted/20 p-3 mb-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' ? <Bot className="h-3 w-3 text-blue-500" /> : <User className="h-3 w-3 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground uppercase">{msg.role}</span>
              </div>
              <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start">
              <div className="px-3 py-2 rounded-lg text-sm bg-muted border animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input 
          placeholder="Ask AI assistant..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
