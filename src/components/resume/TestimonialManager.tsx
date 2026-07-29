import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Send } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

export const TestimonialManager: React.FC<{ resumeId: string }> = ({ resumeId }) => {
  const [clientEmail, setClientEmail] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/testimonials/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTestimonials(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleRequest = async () => {
    if (!clientEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/testimonials/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumeId, clientEmail, projectContext })
      });
      if (res.ok) {
        setClientEmail('');
        setProjectContext('');
        fetchTestimonials();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/testimonials/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchTestimonials();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Client Testimonial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Client Email" 
            value={clientEmail} 
            onChange={e => setClientEmail(e.target.value)} 
          />
          <Input 
            placeholder="Project Context (e.g., Q3 E-commerce Redesign)" 
            value={projectContext} 
            onChange={e => setProjectContext(e.target.value)} 
          />
          <Button onClick={handleRequest} disabled={loading || !clientEmail}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
            Send Request
          </Button>
        </CardContent>
      </Card>

      {testimonials.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-md">Manage Testimonials</h3>
          {testimonials.map(t => (
            <Card key={t._id}>
              <CardContent className="p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium">{t.clientName || t.clientEmail}</p>
                  <p className="text-sm text-muted-foreground">{t.projectContext}</p>
                  {t.quote && <p className="italic mt-2 text-sm">"{t.quote}"</p>}
                  <span className="inline-block mt-2 text-xs font-semibold uppercase px-2 py-1 bg-muted rounded-full">
                    {t.status}
                  </span>
                </div>
                {t.status === 'submitted' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleReview(t._id, 'approve')}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReview(t._id, 'reject')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
