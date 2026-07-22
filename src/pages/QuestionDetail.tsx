import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronUp, ChevronDown, CheckCircle2, MessageSquare, AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { mockQuestions } from '@/components/placement/QnAFeed';
import { useAuth } from '@/hooks/useAuth';

// Mock Answers
const mockAnswers = [
  {
    id: 'a1',
    author: { name: 'Vikram S.', avatar: '', isSenior: true },
    content: 'For Amazon DP problems, they heavily favor 1D DP or "knapsack" variants. Always start by clearly defining your state. Is it `dp[i]` or `dp[i][j]`? Usually, if it\'s a string problem (like word break), 1D is enough. If it\'s a grid/matrix, you need 2D.\n\n```python\n# Standard 1D DP template\ndp = [0] * (n + 1)\ndp[0] = base_case\nfor i in range(1, n + 1):\n    dp[i] = transition(dp[i-1], ...)\n```',
    upvotes: 24,
    isAccepted: true,
    time: '1 hour ago',
    comments: [
      { id: 'c1', author: 'Rahul S.', content: 'This is super helpful, thank you!', time: '45 mins ago' }
    ]
  },
  {
    id: 'a2',
    author: { name: 'Neha J.', avatar: '', isSenior: false },
    content: 'Also, practice the "Longest Palindromic Substring" and "Coin Change" variants. They repeat a lot.',
    upvotes: 5,
    isAccepted: false,
    time: '30 mins ago',
    comments: []
  }
];

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // to check if current user is asker
  const [answers, setAnswers] = useState(mockAnswers);
  const [newAnswer, setNewAnswer] = useState('');

  const question = mockQuestions.find(q => q.id === id) || mockQuestions[0]; // fallback for demo

  // Mock checking if current logged in user is the asker (assuming Rahul S. for demo)
  const isAsker = true; // Hardcoded for demo purposes so we can see the "Accept" button

  const handleAccept = (answerId: string) => {
    setAnswers(answers.map(a => 
      a.id === answerId ? { ...a, isAccepted: !a.isAccepted } : { ...a, isAccepted: false }
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16 max-w-5xl">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feed
        </Button>

        {/* Question Section */}
        <div className="flex gap-6 mb-8">
          <div className="flex flex-col items-center gap-2">
            <Button variant="outline" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
              <ChevronUp className="w-6 h-6" />
            </Button>
            <span className="font-bold text-xl">{question.upvotes}</span>
            <Button variant="outline" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive">
              <ChevronDown className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
            <div className="flex gap-2 mb-6">
              <Badge variant="secondary">{question.category}</Badge>
              {question.company && <Badge variant="outline">{question.company}</Badge>}
            </div>
            
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p>{question.blurb}</p>
              {/* If we had full markdown, it would render here */}
            </div>

            <div className="flex items-center justify-between mt-8 border-t pt-4">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Report
                </Button>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={question.asker.avatar} />
                  <AvatarFallback>{question.asker.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{question.asker.name}</p>
                  <p className="text-xs text-muted-foreground">Asked {question.time}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{answers.length} Answers</h2>
          </div>

          <div className="space-y-6">
            {answers.map(answer => (
              <Card key={answer.id} className={answer.isAccepted ? 'border-green-500/50 bg-green-500/5' : ''}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <ChevronUp className="w-5 h-5" />
                      </Button>
                      <span className="font-bold text-lg">{answer.upvotes}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <ChevronDown className="w-5 h-5" />
                      </Button>
                      
                      {answer.isAccepted && (
                        <CheckCircle2 className="w-6 h-6 text-green-500 mt-2" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap font-sans">
                        {answer.content}
                      </div>
                      
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex gap-2">
                          {isAsker && (
                            <Button 
                              variant={answer.isAccepted ? "secondary" : "outline"} 
                              size="sm"
                              className={answer.isAccepted ? "text-green-600 border-green-200" : ""}
                              onClick={() => handleAccept(answer.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> 
                              {answer.isAccepted ? 'Accepted' : 'Accept Answer'}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Report
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">Answered {answer.time}</span>
                          <div className="bg-primary/10 p-2 rounded-lg flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback>{answer.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-primary">{answer.author.name}</span>
                            {answer.author.isSenior && (
                              <Badge className="h-5 px-1 text-[10px] bg-blue-500">Senior</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Comments */}
                      {answer.comments.length > 0 && (
                        <div className="mt-6 border-t pt-4 space-y-3">
                          {answer.comments.map(c => (
                            <div key={c.id} className="text-sm flex gap-2">
                              <span className="font-semibold text-primary">{c.author}:</span>
                              <span className="text-muted-foreground">{c.content}</span>
                              <span className="text-xs text-muted-foreground/50 ml-auto">{c.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-4 flex gap-2">
                        <Input placeholder="Add a comment..." className="h-8 text-sm" />
                        <Button size="sm" className="h-8">Reply</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Your Answer Form */}
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-4">Your Answer</h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                <Textarea 
                  placeholder="Write your answer here. You can use markdown for code snippets."
                  className="min-h-[150px]"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button disabled={!newAnswer.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Post Answer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
