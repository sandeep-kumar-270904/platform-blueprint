import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, Search, ThumbsUp, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AskAlumniPage: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [search]);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${API_URL}/api/qa/questions`);
      url.searchParams.append('category', 'Alumni');
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/qa/questions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle,
          body: newBody,
          category: 'Alumni',
          tags: ['alumni']
        })
      });

      if (res.ok) {
        toast.success('Question posted successfully!');
        setNewTitle('');
        setNewBody('');
        setIsAsking(false);
        fetchQuestions();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to post question');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ask Alumni</h1>
            <p className="text-muted-foreground mt-1">Get answers to your career questions from the alumni network.</p>
          </div>
          <Button onClick={() => setIsAsking(!isAsking)}>
            {isAsking ? 'Cancel' : 'Ask a Question'}
          </Button>
        </div>

        {isAsking && (
          <Card className="mb-8 border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg">What do you want to ask?</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question Title</label>
                  <Input 
                    placeholder="e.g. How do I transition from QA to SDE?" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Details</label>
                  <Textarea 
                    placeholder="Provide some context about your current situation..."
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit">
                    <Send className="w-4 h-4 mr-2" /> Post Question
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search existing questions..." 
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline">Unanswered</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-white border rounded-xl shadow-sm">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No questions found</h3>
            <p className="text-muted-foreground mt-1 mb-4">Be the first to ask the alumni network a question.</p>
            <Button onClick={() => setIsAsking(true)}>Ask a Question</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q._id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <span className="font-medium text-sm">{q.vote_count || 0}</span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-primary mb-1">{q.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{q.body}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {q.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {q.answer_count || 0} answers
                          </div>
                          <div className="flex items-center gap-2 border-l pl-3">
                            <Avatar className="w-6 h-6 border">
                              <AvatarImage src={q.author?.avatar_url} />
                              <AvatarFallback>{(q.author?.full_name || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{q.author?.full_name || 'Anonymous'}</span>
                            {q.author?.isAlumni && (
                              <Badge variant="outline" className="text-[10px] px-1 h-4 bg-primary/5 text-primary border-primary/20">
                                Alumni
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
