import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Target } from "lucide-react";

interface Suggestion {
  _id: string;
  section: string;
  originalText: string;
  suggestedText: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface TailorReviewProps {
  resume: any;
  updateResume: (data: any) => void;
}

export const TailorReview: React.FC<TailorReviewProps> = ({ resume, updateResume }) => {
  const suggestions: Suggestion[] = resume.tailorSuggestions || [];
  const pending = suggestions.filter(s => s.status === 'pending');

  if (pending.length === 0) return null;

  const handleAction = async (id: string, action: 'accepted' | 'rejected', suggestion: Suggestion) => {
    const newSuggestions = suggestions.map(s => 
      s._id === id ? { ...s, status: action } : s
    );
    
    const updates: any = { tailorSuggestions: newSuggestions };

    // Apply the change if accepted
    if (action === 'accepted') {
      const sectionData = [...(resume[suggestion.section] || [])];
      
      // Because we don't have exact indexes in the suggestion (just text matching),
      // we need to find the text and replace it.
      let applied = false;
      
      for (let i = 0; i < sectionData.length; i++) {
        if (sectionData[i].bulletPoints) {
          const bpIndex = sectionData[i].bulletPoints.findIndex((bp: string) => bp === suggestion.originalText);
          if (bpIndex !== -1) {
            sectionData[i].bulletPoints[bpIndex] = suggestion.suggestedText;
            applied = true;
            break;
          }
        }
      }
      
      if (applied) {
        updates[suggestion.section] = sectionData;
      }
    }

    updateResume(updates);
  };

  return (
    <Card className="border-primary bg-primary/5 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Target className="h-5 w-5" />
          AI Tailoring Suggestions ({pending.length} pending)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pending.map(s => (
          <div key={s._id} className="p-4 bg-background rounded-md border shadow-sm">
            <div className="mb-2 flex justify-between items-start">
              <span className="text-xs font-semibold uppercase text-muted-foreground">{s.section}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleAction(s._id, 'rejected', s)}>
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(s._id, 'accepted', s)}>
                  <Check className="h-4 w-4 mr-1" /> Accept
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 rounded text-sm line-through decoration-red-300">
                {s.originalText}
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-200 rounded text-sm font-medium border border-green-200 dark:border-green-800">
                {s.suggestedText}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
