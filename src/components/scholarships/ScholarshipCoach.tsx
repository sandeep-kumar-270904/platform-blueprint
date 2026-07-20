import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Loader2, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ScholarshipCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, message: string}[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadSession();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const loadSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarship-coach/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.conversationHistory || []);
        setFocusAreas(data.focusAreas || []);
      }
    } catch (err) {
      console.error('Failed to load coach session', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', message: userMsg }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarship-coach/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // We inject the contextType here so the backend knows to pull scholarship context
        body: JSON.stringify({ message: userMsg, contextType: 'scholarships' })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'coach', message: data.reply }]);
        setFocusAreas(data.focusAreas || []);
      } else {
        setMessages(prev => [...prev, { role: 'coach', message: 'Something went wrong, try again' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'coach', message: 'Something went wrong, try again' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[350px] h-[500px] shadow-2xl flex flex-col z-50 border-primary/20">
      <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle className="text-md">Scholarship Coach</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:text-primary hover:bg-white" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {focusAreas.length > 0 && (
          <div className="bg-muted p-2 text-xs border-b">
            <div className="flex items-center gap-1 mb-1 font-semibold text-muted-foreground">
              <Target className="h-3 w-3" /> Focus Areas
            </div>
            <div className="flex flex-wrap gap-1">
              {focusAreas.map(area => (
                <Badge variant="secondary" key={area} className="text-[10px] px-1 py-0">{area}</Badge>
              ))}
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                Scholarship Assistant. How can I help you with your applications today?
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {msg.message}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3 text-sm bg-muted flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-background rounded-b-lg">
        <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <Input 
            placeholder="Type your message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
