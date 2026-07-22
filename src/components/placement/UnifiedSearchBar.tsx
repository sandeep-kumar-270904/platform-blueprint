import React, { useState, useRef, useEffect } from 'react';
import { Search, History, TrendingUp, Building2, Code, FileText, Users, MessageSquare, ArrowRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

// Global Mock Data for Search
export const MOCK_SEARCH_DATA = [
  { id: 'c1', type: 'company', title: 'Amazon', blurb: 'E-commerce, Cloud Computing', matchTags: ['amazon', 'aws', 'faang'] },
  { id: 'c2', type: 'company', title: 'Google', blurb: 'Search, Cloud, Ads', matchTags: ['google', 'faang'] },
  { id: 'd1', type: 'dsa', title: 'Two Sum', blurb: 'Easy • Array, Hash Table', matchTags: ['two', 'sum', 'array', 'easy'] },
  { id: 'd2', type: 'dsa', title: 'LRU Cache', blurb: 'Medium • Design, Linked List', matchTags: ['lru', 'cache', 'design', 'amazon'] },
  { id: 'i1', type: 'interview', title: 'Amazon Leadership Principles', blurb: 'Behavioral Questions & Tips', matchTags: ['amazon', 'lp', 'behavioral'] },
  { id: 'a1', type: 'aptitude', title: 'Time and Work', blurb: 'Quantitative Aptitude', matchTags: ['time', 'work', 'quant', 'math'] },
  { id: 'g1', type: 'group', title: 'FAANG Prep 2026', blurb: 'Study Group • 142 members', matchTags: ['faang', 'prep', 'study'] },
  { id: 'q1', type: 'qa', title: 'How to approach Dynamic Programming questions in Amazon OA?', blurb: 'Doubt Solving • 3 Answers', matchTags: ['dp', 'amazon', 'oa', 'dynamic'] },
  { id: 'r1', type: 'referrer', title: 'Rahul S.', blurb: 'Software Engineer II @ Amazon', matchTags: ['rahul', 'amazon', 'sde2'] }
];

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
  company: 'Companies',
  dsa: 'DSA Problems',
  interview: 'Interview Prep',
  aptitude: 'Aptitude Topics',
  group: 'Study Groups',
  qa: 'Q&A',
  referrer: 'Referrers'
};

export function UnifiedSearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [recentSearches, setRecentSearches] = useState<string[]>(['Amazon OA', 'Dynamic Programming', 'Google Interview']);
  const trendingSearches = ['TCS NQT', 'Two Sum', 'Resume Tips', 'Accenture Pattern'];

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    // Add to recent
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    
    setIsFocused(false);
    navigate(`/placement/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const clearRecent = () => setRecentSearches([]);

  // Compute matches
  const searchLower = query.toLowerCase().trim();
  let results = [];
  if (searchLower) {
    results = MOCK_SEARCH_DATA.filter(item => 
      item.title.toLowerCase().includes(searchLower) || 
      item.matchTags.some(tag => tag.includes(searchLower))
    );
  }

  // Group matches
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, typeof MOCK_SEARCH_DATA>);

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={wrapperRef}>
      <div 
        className={`relative flex items-center transition-all duration-300 ${isFocused ? 'ring-2 ring-primary shadow-lg rounded-t-lg bg-background' : 'bg-background/80 backdrop-blur-sm rounded-lg shadow-sm border'}`}
        aria-expanded={isFocused}
        aria-haspopup="listbox"
        aria-controls="search-results-list"
      >
        <Search className="absolute left-4 w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <Input 
          className="w-full pl-12 pr-4 py-6 border-0 focus-visible:ring-0 bg-transparent text-base"
          placeholder="Search companies, problems, questions, groups..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          aria-label="Unified Search"
        />
        {query && (
          <Button variant="ghost" size="icon" className="absolute right-3 h-8 w-8 text-muted-foreground" onClick={() => setQuery('')} aria-label="Clear search">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isFocused && (
        <Card id="search-results-list" role="listbox" className="absolute top-full left-0 w-full mt-1 border-t-0 rounded-t-none shadow-xl max-h-[70vh] overflow-y-auto">
          <CardContent className="p-0">
            
            {/* Empty State: Recent & Trending */}
            {!query.trim() && (
              <div className="p-4 space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-2"><History className="w-4 h-4" /> Recent Searches</div>
                      <button onClick={clearRecent} className="text-xs hover:text-primary">Clear all</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(term => (
                        <Badge 
                          key={term} 
                          variant="secondary" 
                          className="px-3 py-1.5 cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => { setQuery(term); handleSearch(term); }}
                        >
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                    <TrendingUp className="w-4 h-4" /> Trending Now
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map(term => (
                      <Badge 
                        key={term} 
                        variant="outline" 
                        className="px-3 py-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => { setQuery(term); handleSearch(term); }}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results State */}
            {query.trim() && Object.keys(groupedResults).length > 0 && (
              <div className="py-2">
                {Object.entries(groupedResults).map(([type, items]) => {
                  const Icon = ICONS[type as keyof typeof ICONS] || Search;
                  return (
                    <div key={type} className="mb-4 last:mb-0">
                      <div className="px-4 py-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                        <Icon className="w-3.5 h-3.5" /> {TYPE_LABELS[type as keyof typeof TYPE_LABELS]}
                      </div>
                      <div className="py-1">
                        {items.slice(0, 3).map(item => (
                          <div 
                            key={item.id}
                            role="option"
                            aria-selected="false"
                            tabIndex={0}
                            className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center group focus:bg-muted focus:outline-none"
                            onClick={() => handleSearch(item.title)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(item.title)}
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.blurb}</p>
                            </div>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div 
                            className="px-4 py-2 text-xs font-medium text-primary cursor-pointer hover:underline"
                            onClick={() => handleSearch(query)}
                          >
                            See all {items.length} {TYPE_LABELS[type as keyof typeof TYPE_LABELS]} matches →
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div 
                  className="px-4 py-3 bg-primary/5 border-t border-primary/10 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSearch(query)}
                >
                  <span className="text-sm font-medium text-primary">See all results for "{query}"</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </div>
            )}

            {/* No Results State */}
            {query.trim() && Object.keys(groupedResults).length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No exact matches found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  We couldn't find anything matching "{query}". 
                </p>
                <div className="bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
                  <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Stuck on a problem?</p>
                  <p className="text-xs text-muted-foreground mb-3">Ask the community or alumni network in Doubt Solving.</p>
                  <Button size="sm" className="w-full" onClick={() => navigate('/placement/doubt-solving')}>
                    Ask a Question
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
