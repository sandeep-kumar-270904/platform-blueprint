import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, TrendingUp, Lightbulb } from "lucide-react";

interface SalaryNegotiatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

export const SalaryNegotiator: React.FC<SalaryNegotiatorProps> = ({ open, onOpenChange, resumeId }) => {
  const [step, setStep] = useState<'input' | 'results'>('input');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleGenerate = async () => {
    if (!role || !location || !offerAmount) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/negotiation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumeId, role, location, offerAmount })
      });
      if (res.ok) {
        setResults(await res.json());
        setStep('results');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setRole('');
    setLocation('');
    setOfferAmount('');
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Salary Negotiation Assistant
          </DialogTitle>
          <DialogDescription>
            This data is ephemeral and completely private. It is not saved to your profile or shown to anyone else.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role/Title</Label>
                <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Frontend Developer" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. New York, NY" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Offer Amount (Total Comp)</Label>
              <Input value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. $130,000" />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleGenerate} disabled={!role || !location || !offerAmount || loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : 'Analyze Offer'}
              </Button>
            </div>
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-6 pt-4">
            <div className="p-4 bg-muted/30 border rounded-lg">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" /> Market Salary Insights
              </h4>
              {results.marketData ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Market Min</p>
                    <p className="text-xl font-bold">{results.marketData.avgMin.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Max</p>
                    <p className="text-xl font-bold">{results.marketData.avgMax.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Based On</p>
                    <p className="text-lg font-medium">{results.marketData.dataPoints} platform jobs</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No aggregate market data available for this specific role and location on our platform.</p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" /> Suggested Talking Points
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Based on the quantified impacts in your resume, you can use these points to negotiate effectively:
              </p>
              <ul className="space-y-3">
                {results.talkingPoints.map((point: string, i: number) => (
                  <li key={i} className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-md text-sm">
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleClose} variant="outline">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
