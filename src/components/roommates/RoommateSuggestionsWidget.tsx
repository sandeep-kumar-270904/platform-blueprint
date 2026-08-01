import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Users, RefreshCw } from "lucide-react";

interface Suggestion {
  id: string;
  type: string;
  title: string;
  reason: string;
  actionLabel: string;
  targetId: string;
}

interface RoommateSuggestionsWidgetProps {
  onActionClick: (type: string, targetId: string) => void;
  refreshTrigger?: number;
}

export const RoommateSuggestionsWidget: React.FC<RoommateSuggestionsWidgetProps> = ({ onActionClick, refreshTrigger = 0 }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/roommates/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Error fetching suggestions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [refreshTrigger]);

  const handleDismiss = async (suggestionId: string) => {
    // Optimistic UI update
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_URL}/api/roommates/suggestions/dismiss`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ suggestionId })
      });
    } catch (err) {
      console.error('Error dismissing suggestion', err);
    }
  };

  if (loading && suggestions.length === 0) return null;
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Suggested for You</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="min-w-[280px] max-w-[320px] shrink-0 snap-start border-primary/20 bg-primary/5 relative overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:bg-background/50 hover:text-foreground z-10"
              onClick={() => handleDismiss(suggestion.id)}
            >
              <X className="w-3 h-3" />
            </Button>
            <CardContent className="p-4 pt-5 flex flex-col h-full">
              <div className="flex items-start gap-3 mb-2">
                <div className="bg-background rounded-full p-2 text-primary shrink-0">
                  {suggestion.type === 'manage_group' ? <Users className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight pr-4">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-3">
                <Button 
                  size="sm" 
                  className="w-full h-8 text-xs font-medium"
                  onClick={() => onActionClick(suggestion.type, suggestion.targetId)}
                >
                  {suggestion.actionLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
