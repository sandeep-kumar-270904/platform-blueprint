import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, ThumbsUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MentorCommunity() {
  const [threads, setThreads] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadBody, setNewThreadBody] = useState("");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionBody, setNewQuestionBody] = useState("");

  const fetchThreads = async () => {
    try {
      const res = await api.get('/mentor-community/forums');
      setThreads(res.data.threads);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/mentor-community/qa');
      setQuestions(res.data.questions);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchThreads();
    fetchQuestions();
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/mentor-community/forums', { title: newThreadTitle, body: newThreadBody, category: 'General' });
    setNewThreadTitle("");
    setNewThreadBody("");
    fetchThreads();
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/mentor-community/qa', { title: newQuestionTitle, body: newQuestionBody, category: 'General' });
    setNewQuestionTitle("");
    setNewQuestionBody("");
    fetchQuestions();
  };

  const handleReport = async (type: 'forum' | 'qa', id: string) => {
    try {
      if (type === 'forum') {
        await api.post(`/mentor-community/forums/\${id}/report`);
      }
      alert('Reported successfully');
    } catch (e) {
      alert('Failed or already reported');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Mentor Community
          </h1>
          <p className="text-muted-foreground mt-2">Connect, ask, and share with verified mentors and peers.</p>
        </div>
      </div>

      <Tabs defaultValue="forums" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forums"><MessageSquare className="w-4 h-4 mr-2" /> Discussions</TabsTrigger>
          <TabsTrigger value="qa"><Users className="w-4 h-4 mr-2" /> Peer Q&A</TabsTrigger>
        </TabsList>

        <TabsContent value="forums" className="mt-6 space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Start a Discussion</h2>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <Input placeholder="Thread Title" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} required />
              <textarea 
                className="w-full p-3 rounded-md bg-background border border-input text-sm" 
                rows={3} 
                placeholder="What's on your mind?"
                value={newThreadBody}
                onChange={e => setNewThreadBody(e.target.value)}
                required
              />
              <Button type="submit">Post Thread</Button>
            </form>
          </div>

          <div className="space-y-4">
            {threads.map(thread => (
              <div key={thread._id} className="bg-card p-4 rounded-lg border flex gap-4 items-start transition-all hover:border-primary/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{thread.title}</h3>
                    {thread.is_pinned && <Badge variant="secondary">Pinned</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{thread.body}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3"/> {thread.reply_count}</span>
                    <span>By {thread.user_id?.full_name || 'Unknown'}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleReport('forum', thread._id)}>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qa" className="mt-6 space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Ask the Community</h2>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <Input placeholder="Question Title" value={newQuestionTitle} onChange={e => setNewQuestionTitle(e.target.value)} required />
              <textarea 
                className="w-full p-3 rounded-md bg-background border border-input text-sm" 
                rows={3} 
                placeholder="Describe your question in detail..."
                value={newQuestionBody}
                onChange={e => setNewQuestionBody(e.target.value)}
                required
              />
              <Button type="submit">Post Question</Button>
            </form>
          </div>

          <div className="space-y-4">
            {questions.map(q => (
              <div key={q._id} className="bg-card p-4 rounded-lg border flex gap-4 items-start">
                <div className="flex flex-col items-center gap-1 min-w-[60px] p-2 bg-muted/30 rounded-md">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="font-medium">{q.upvotes || 0}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{q.title}</h3>
                    {q.status === 'answered' && <Badge variant="default" className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Answered</Badge>}
                    {q.status === 'closed' && <Badge variant="outline">Closed</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{q.body}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{q.answer_count} answers</span>
                    <span>Asked by {q.user_id?.full_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
