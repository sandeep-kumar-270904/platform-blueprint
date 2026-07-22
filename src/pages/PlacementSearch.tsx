import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { UnifiedSearchBar, MOCK_SEARCH_DATA } from '@/components/placement/UnifiedSearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, Code, FileText, Users, MessageSquare, ArrowLeft } from 'lucide-react';

const ICONS = {
  company: Building2,
  dsa: Code,
  interview: FileText,
  aptitude: FileText,
  group: Users,
  qa: MessageSquare,
  referrer: Users
};

const TYPE_LABELS = {
  all: 'All Results',
  company: 'Companies',
  dsa: 'DSA Problems',
  interview: 'Interview Prep',
  aptitude: 'Aptitude Topics',
  group: 'Study Groups',
  qa: 'Q&A',
  referrer: 'Referrers'
};

export default function PlacementSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');

  const searchLower = query.toLowerCase().trim();
  let results = [];
  if (searchLower) {
    results = MOCK_SEARCH_DATA.filter(item => 
      item.title.toLowerCase().includes(searchLower) || 
      item.matchTags.some(tag => tag.includes(searchLower))
    );
  }

  // Calculate counts for tabs
  const counts = results.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, { all: 0 } as Record<string, number>);

  const displayResults = activeTab === 'all' ? results : results.filter(r => r.type === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16 max-w-7xl">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate('/placement/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Search Results</h1>
            <p className="text-muted-foreground">Showing results for <span className="font-semibold text-foreground">"{query}"</span></p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-md">
            <UnifiedSearchBar />
          </div>
        </div>

        {results.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar / Filters */}
            <div className="w-full lg:w-64 shrink-0">
              <div className="sticky top-24">
                <h3 className="font-semibold mb-4">Filter by Type</h3>
                <div className="flex flex-col gap-1">
                  {Object.entries(TYPE_LABELS).map(([key, label]) => {
                    const count = counts[key] || 0;
                    if (key !== 'all' && count === 0) return null;
                    
                    return (
                      <Button
                        key={key}
                        variant={activeTab === key ? "secondary" : "ghost"}
                        className="justify-between w-full"
                        onClick={() => setActiveTab(key)}
                      >
                        <span>{label}</span>
                        <Badge variant="secondary" className="ml-2">{count}</Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 space-y-4">
              {displayResults.map(item => {
                const Icon = ICONS[item.type as keyof typeof ICONS] || Search;
                return (
                  <Card key={item.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex gap-4 items-start">
                      <div className="mt-1 bg-muted p-2 rounded-md group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {TYPE_LABELS[item.type as keyof typeof TYPE_LABELS]}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{item.blurb}</p>
                        
                        <div className="flex gap-2 mt-3">
                          {item.matchTags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs font-normal text-muted-foreground">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-muted-foreground mb-8">
              We couldn't find anything matching <span className="font-semibold text-foreground">"{query}"</span>. 
              Try checking your spelling or using more general terms.
            </p>
            
            <Card className="w-full bg-gradient-to-br from-primary/5 to-background border-primary/20">
              <CardContent className="p-6">
                <MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Still stuck?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask the community or alumni network directly. Someone has likely solved this before.
                </p>
                <Button className="w-full" onClick={() => navigate('/placement/doubt-solving')}>
                  Go to Doubt Solving
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
