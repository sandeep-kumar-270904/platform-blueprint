import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";

export const PublicTestimonialForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [context, setContext] = useState('');
  const [clientName, setClientName] = useState('');
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/testimonials/public/${token}`);
        if (res.ok) {
          const data = await res.json();
          setContext(data.projectContext);
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

  const handleSubmit = async () => {
    if (!clientName || !quote) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/testimonials/public/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, quote })
      });
      if (res.ok) setSuccess(true);
      else setError('Failed to submit testimonial.');
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  
  if (error) return (
    <div className="container max-w-md mx-auto pt-24">
      <Card><CardContent className="p-6 text-center text-red-500">{error}</CardContent></Card>
    </div>
  );

  if (success) return (
    <div className="container max-w-md mx-auto pt-24">
      <Card>
        <CardContent className="p-12 text-center flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold">Thank You!</h2>
          <p className="text-muted-foreground mt-2">Your testimonial has been submitted successfully.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container max-w-lg mx-auto pt-24">
      <Card>
        <CardHeader>
          <CardTitle>Submit Testimonial</CardTitle>
          <CardDescription>
            You have been requested to provide a brief testimonial for a past engagement.
            {context && <p className="mt-2 font-medium text-foreground">Project: {context}</p>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Your Name (or Company Name)</label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Testimonial Quote</label>
            <Textarea 
              className="h-32" 
              value={quote} 
              onChange={e => setQuote(e.target.value)} 
              placeholder="They did a great job on..."
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting || !clientName || !quote}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
