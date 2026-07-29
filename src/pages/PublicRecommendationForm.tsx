import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

export const PublicRecommendationForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [info, setInfo] = useState<any>(null);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recommendations/public/${token}`);
        if (res.ok) {
          setInfo(await res.json());
        } else {
          setError('Invalid or expired request link.');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    if (token) checkToken();
  }, [token]);

  const handleDraftAI = async () => {
    setDrafting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recommendations/public/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, requestNotes: notes })
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.draft);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDrafting(false);
    }
  };

  const handleSubmit = async () => {
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recommendations/public/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) setSuccess(true);
      else setError('Failed to submit.');
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="container max-w-md mx-auto pt-24"><Card><CardContent className="p-6 text-center text-red-500">{error}</CardContent></Card></div>;
  if (success) return (
    <div className="container max-w-md mx-auto pt-24">
      <Card>
        <CardContent className="p-12 text-center flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold">Thank You!</h2>
          <p className="text-muted-foreground mt-2">Your recommendation for {info.requesterName} has been submitted.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container max-w-2xl mx-auto pt-24 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Write a Recommendation</CardTitle>
          <CardDescription>
            <strong>{info.requesterName}</strong> requested a recommendation from you (Relationship: {info.relationship}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-md border">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-purple-500"/> AI Drafting Assistant</h4>
            <p className="text-xs text-muted-foreground mb-3">Provide some bullet points and let AI draft a professional letter for you. You can edit it before submitting.</p>
            <Textarea 
              placeholder="e.g. Led the Q3 project successfully, great team player, highly organized..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mb-2"
            />
            <Button variant="secondary" size="sm" onClick={handleDraftAI} disabled={drafting}>
              {drafting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
              Generate Draft
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Recommendation Letter</label>
            <Textarea 
              className="h-64" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Write your recommendation here..."
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting || !content}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Recommendation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
