import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, useMentor } from '@/hooks/useMentor';
import { Brain, User, Send, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MentorChatProps {
  initialHistory: ChatMessage[];
  onEditProfile: () => void;
}

export const MentorChat: React.FC<MentorChatProps> = ({ initialHistory, onEditProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useMentor();

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsSending(true);

    try {
      const response = await sendMessage(userMsg);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (err) {
      // handled in hook
      setMessages(prev => [...prev, { role: 'model', content: "**Error:** Failed to connect to mentor. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[80vh] flex flex-col border-border shadow-sm mx-auto max-w-4xl">
      <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Mentor</CardTitle>
            <p className="text-xs text-muted-foreground">Personalized guidance based on your profile and real platform data</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEditProfile} className="gap-2">
          <Settings className="w-4 h-4" />
          Edit Profile
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
            {messages.length === 0 && (
              <div className="text-center py-10 opacity-70">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">Your Mentor is Ready</h3>
                <p className="text-sm">Ask about college recommendations, placement data for your branch, or advice on your academic standing.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-secondary' : 'bg-primary/20'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4 text-primary" />}
                </div>
                <div 
                  className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm prose prose-sm dark:prose-invert ${
                    msg.role === 'user' 
                      ? 'bg-secondary text-secondary-foreground rounded-tr-none' 
                      : 'bg-muted/50 border border-border rounded-tl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="m-0 whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            
            {isSending && (
              <div className="flex gap-4 flex-row">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-muted/50 border border-border rounded-tl-none flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 border-t border-border">
        <form 
          className="flex w-full gap-2 max-w-3xl mx-auto" 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <Input 
            placeholder="Ask your mentor something..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 bg-background"
          />
          <Button type="submit" disabled={!inputValue.trim() || isSending} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
