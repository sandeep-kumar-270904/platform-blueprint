import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, AlertCircle, ThumbsUp, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ProviderFeedbackSummaryModalProps {
  scholarshipId: string;
}

export const ProviderFeedbackSummaryModal: React.FC<ProviderFeedbackSummaryModalProps> = ({ scholarshipId }) => {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSummary();
    }
  }, [open]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/provider-feedback/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mr-2">
          <MessageSquare className="h-4 w-4 mr-2" /> Feedback Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applicant Feedback Summary</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !summary || summary.totalResponses === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            No feedback responses collected yet.
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="bg-primary/5 p-4 rounded-md border border-primary/20 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-primary uppercase">Total Responses</p>
                <p className="text-3xl font-bold text-foreground mt-1">{summary.totalResponses}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600 flex items-center justify-end gap-1"><ThumbsUp className="h-4 w-4" /> Clarity</p>
                <p className="text-xl font-bold mt-1">{summary.clearPercentage.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600 flex items-center justify-end gap-1"><AlertCircle className="h-4 w-4" /> Accuracy</p>
                <p className="text-xl font-bold mt-1">{summary.accuratePercentage.toFixed(1)}%</p>
              </div>
            </div>

            {summary.topConfusingSteps && summary.topConfusingSteps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-orange-500" /> Top Confusing Steps</h4>
                <div className="space-y-2">
                  {summary.topConfusingSteps.map((step: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 border rounded bg-background">
                      <span className="font-medium text-sm">{step.step}</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">{step.count} mentions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.confusingStepsText && summary.confusingStepsText.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recent Comments & Questions</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {summary.confusingStepsText.map((text: string, idx: number) => (
                    <Card key={idx} className="bg-muted/30">
                      <CardContent className="p-3 text-sm">
                        "{text}"
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground mt-4">
              <strong>Tip for Providers:</strong> If your clarity percentage is below 70%, consider reviewing your application requirements and instructions. The "Top Confusing Steps" can help pinpoint where applicants struggle.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
