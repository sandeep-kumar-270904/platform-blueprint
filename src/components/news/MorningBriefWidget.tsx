import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, ExternalLink, TrendingUp, Clock, ShieldCheck, X } from "lucide-react";
import { trackArticleView } from "@/hooks/useNews";
import { formatDistanceToNow } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function MorningBriefWidget() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const res = await fetch(`${API_URL}/api/news/morning-brief`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setArticles(data);
        }
      } catch (err) {
        console.error('Failed to fetch morning brief', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrief();
  }, []);

  if (loading || articles.length === 0 || !visible) return null;

  return (
    <div className="mb-10 bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-sm relative animate-in fade-in slide-in-from-top-4">
      <button 
        onClick={() => setVisible(false)}
        className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors"
        title="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="flex items-center gap-2 mb-4">
        <Coffee className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold font-serif text-foreground">Your Morning Brief</h2>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Curated highlights based on your preferences over the last 24 hours.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.slice(0, 3).map(article => (
          <a 
            key={article._id}
            href={article.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackArticleView(article._id)}
            className="group flex flex-col justify-between block p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-all"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-[10px] bg-background">
                  {article.category}
                </Badge>
                {article.sourceCredibility && (
                  <span className="text-[10px] text-foreground/40 flex items-center bg-background px-1.5 py-0.5 rounded border border-border">
                    <ShieldCheck className="h-3 w-3 mr-1 text-green-600" />
                    {article.sourceCredibility}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-3 mb-2">
                {article.title}
              </h3>
            </div>
            <div className="mt-auto pt-2 flex items-center justify-between text-xs text-foreground/50 border-t border-border/50">
              <span className="font-medium">{article.sourceName}</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {article.readingTime ? `${article.readingTime}m` : '3m'}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
