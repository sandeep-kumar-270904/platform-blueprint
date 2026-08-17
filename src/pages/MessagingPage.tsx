import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, ArrowLeft, MoreVertical, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const MessagingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const newRecipientId = searchParams.get('new');
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchConversationDetails(activeConversation._id);
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/direct-messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        
        // If there's a new recipient requested, handle it
        if (newRecipientId) {
          const existing = data.find((c: any) => 
            c.participants.some((p: any) => p._id === newRecipientId)
          );
          if (existing) {
            setActiveConversation(existing);
          } else {
            // Need to start a new thread
            setActiveConversation({ isNew: true, participants: [{ _id: newRecipientId, full_name: 'New Connection' }] });
          }
        } else if (data.length > 0 && !activeConversation) {
          setActiveConversation(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (id: string) => {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/direct-messages/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        
        // Mark as read
        fetch(`${API_URL}/api/direct-messages/${id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const token = localStorage.getItem('token');
    const endpoint = activeConversation.isNew 
      ? `${API_URL}/api/direct-messages` 
      : `${API_URL}/api/direct-messages/${activeConversation._id}/messages`;
    
    const body = activeConversation.isNew 
      ? { participantIds: [newRecipientId], content: newMessage }
      : { content: newMessage };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setNewMessage('');
        if (activeConversation.isNew) {
          // Refresh list to get the real conversation id
          await fetchConversations();
        } else {
          await fetchConversationDetails(activeConversation._id);
          // Also refresh list to bump to top
          fetchConversations();
        }
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getOtherParticipant = (participants: any[]) => {
    return participants.find((p: any) => p._id !== user?.id) || participants[0];
  };

  const getLastMessageText = (conv: any) => {
    if (!conv.messages || conv.messages.length === 0) return 'New conversation';
    return conv.messages[conv.messages.length - 1].content;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl w-full mx-auto md:p-6 flex flex-col md:flex-row gap-6 mt-4 h-[calc(100vh-80px)]">
        
        {/* Sidebar */}
        <div className={`w-full md:w-1/3 bg-white border rounded-xl flex flex-col overflow-hidden shadow-sm ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b bg-gray-50/50">
            <h2 className="font-semibold text-lg">Messages</h2>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full pl-9 pr-4 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {conversations.length === 0 && !newRecipientId ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No messages yet.</p>
                <Button variant="link" size="sm" onClick={() => navigate('/alumni/connections/network')}>
                  Go to Network
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => {
                  const otherPerson = getOtherParticipant(conv.participants);
                  const isUnread = conv.messages?.length > 0 && 
                    !conv.messages[conv.messages.length - 1].readBy?.includes(user?.id);
                  
                  return (
                    <div 
                      key={conv._id} 
                      className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${activeConversation?._id === conv._id ? 'bg-primary/5' : ''}`}
                      onClick={() => setActiveConversation(conv)}
                    >
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={otherPerson?.avatar_url} />
                        <AvatarFallback>{(otherPerson?.full_name || otherPerson?.username || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>
                            {otherPerson?.full_name || otherPerson?.username || 'User'}
                          </h4>
                          {conv.messages?.length > 0 && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(conv.messages[conv.messages.length - 1].sentAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${isUnread ? 'font-medium text-gray-900' : 'text-muted-foreground'}`}>
                          {getLastMessageText(conv)}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`w-full md:w-2/3 bg-white border rounded-xl flex flex-col overflow-hidden shadow-sm ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setActiveConversation(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={getOtherParticipant(activeConversation.participants)?.avatar_url} />
                    <AvatarFallback>{(getOtherParticipant(activeConversation.participants)?.full_name || getOtherParticipant(activeConversation.participants)?.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {getOtherParticipant(activeConversation.participants)?.full_name || getOtherParticipant(activeConversation.participants)?.username || 'User'}
                    </h3>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
              >
                {messages.length === 0 && !activeConversation.isNew ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No messages in this conversation.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <span className={`text-[10px] mt-1 block opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[44px] max-h-[120px] resize-none py-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-gray-50/30">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
