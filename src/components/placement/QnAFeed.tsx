import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronUp, MessageSquare, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const mockQuestions = [
  {
    id: 'q1',
    title: 'How to approach Dynamic Programming questions in Amazon OA?',
    blurb: 'I always get stuck on the state transitions for 2D DP problems. Is there a pattern I should follow specifically for Amazon?',
    category: 'Company-specific',
    company: 'Amazon',
    upvotes: 42,
    answerCount: 3,
    isAnswered: true,
    asker: { name: 'Rahul S.', avatar: '' },
    time: '2 hours ago'
  },
  {
    id: 'q2',
    title: 'Does TCS NQT allow Python for the coding section?',
    blurb: 'I heard they recently updated their compiler. Can anyone confirm if Python 3.9+ is fully supported?',
    category: 'General',
    company: 'TCS',
    upvotes: 15,
    answerCount: 1,
    isAnswered: false,
    asker: { name: 'Priya K.', avatar: '' },
    time: '5 hours ago'
  },
  {
    id: 'q3',
    title: 'Resume Review: Is a 1-page resume strictly required?',
    blurb: 'I have a lot of projects and internships, and it spills over to 1.5 pages. Will ATS reject it automatically?',
    category: 'Resume',
    company: null,
    upvotes: 89,
    answerCount: 12,
    isAnswered: true,
    asker: { name: 'Aman D.', avatar: '' },
    time: '1 day ago'
  }
];

export function QnAFeed({ mode }: { mode: 'feed' | 'activity' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // In a real app, 'activity' mode would fetch the user's specific questions
  const displayQuestions = mockQuestions.filter(q => {
    if (categoryFilter !== 'All' && q.category !== categoryFilter) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => sortBy === 'upvoted' ? b.upvotes - a.upvotes : 0); // Simplified sort

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Feed */}
      <div className="flex-1 space-y-6">
        {mode === 'feed' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search questions..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="upvoted">Most Upvoted</SelectItem>
                <SelectItem value="unanswered">Unanswered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="DSA">DSA</SelectItem>
                <SelectItem value="Interview Prep">Interview Prep</SelectItem>
                <SelectItem value="Resume">Resume</SelectItem>
                <SelectItem value="Company-specific">Company-specific</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === 'activity' && (
          <div className="flex gap-4 mb-6 border-b pb-4">
            <Button variant="default">My Questions</Button>
            <Button variant="ghost">My Answers</Button>
            <Button variant="ghost">Saved/Bookmarks</Button>
          </div>
        )}

        <div className="space-y-4">
          {displayQuestions.map(q => (
            <Card key={q.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 sm:p-6 flex gap-4">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <ChevronUp className="w-5 h-5" />
                  </Button>
                  <span className="font-bold text-lg">{q.upvotes}</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary">{q.category}</Badge>
                    {q.company && <Badge variant="outline">{q.company}</Badge>}
                  </div>
                  
                  <Link to={`/placement/doubt-solving/${q.id}`} className="hover:underline">
                    <h3 className="text-xl font-bold text-primary mb-2 leading-tight">{q.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{q.blurb}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={q.asker.avatar} />
                        <AvatarFallback>{q.asker.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{q.asker.name}</span>
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1 inline" /> {q.time}</span>
                    </div>
                    
                    <div className={`flex items-center gap-1 font-medium px-2 py-1 rounded-md ${q.isAnswered ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      <MessageSquare className="w-4 h-4" />
                      {q.answerCount} {q.answerCount === 1 ? 'Answer' : 'Answers'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {displayQuestions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No questions found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
          <CardContent className="p-6 text-center">
            <Award className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-1">Top Helpers This Month</h3>
            <p className="text-sm text-muted-foreground mb-4">Earn XP and badges by answering doubts.</p>
            
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between text-sm bg-background p-2 rounded-md shadow-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6"><AvatarFallback>A{i}</AvatarFallback></Avatar>
                    <span className="font-medium">Alumni {i}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">{100 - i * 10} XP</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
