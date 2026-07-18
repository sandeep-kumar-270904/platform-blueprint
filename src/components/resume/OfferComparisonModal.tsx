import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onClose: () => void;
}

export default function OfferComparisonModal({ onClose }: Props) {
  const { token } = useAuth();
  const [offers, setOffers] = useState([{ company: '', role: '', compensation: '', location: '', notes: '' }, { company: '', role: '', compensation: '', location: '', notes: '' }]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddOffer = () => {
    if (offers.length < 4) {
      setOffers([...offers, { company: '', role: '', compensation: '', location: '', notes: '' }]);
    }
  };

  const updateOffer = (index: number, field: string, value: string) => {
    const newOffers = [...offers];
    newOffers[index] = { ...newOffers[index], [field]: value };
    setOffers(newOffers);
  };

  const handleCompare = async () => {
    const validOffers = offers.filter(o => o.company && o.role);
    if (validOffers.length < 2) return alert("Enter at least 2 valid offers");
    
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/offers/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ offers: validOffers })
      });
      const data = await res.json();
      setQuestions(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-4xl w-full my-8">
        <CardHeader>
          <CardTitle>Private Offer Comparison</CardTitle>
          <p className="text-sm text-muted-foreground">This is an ephemeral session. Your offer data is not saved.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers.map((offer, i) => (
              <div key={i} className="border p-4 rounded-md space-y-3 bg-muted/20">
                <h3 className="font-semibold text-sm">Offer {i + 1}</h3>
                <div>
                  <Label className="text-xs">Company</Label>
                  <Input value={offer.company} onChange={e => updateOffer(i, 'company', e.target.value)} placeholder="Acme Corp" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Role</Label>
                  <Input value={offer.role} onChange={e => updateOffer(i, 'role', e.target.value)} placeholder="Engineer" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Compensation</Label>
                  <Input value={offer.compensation} onChange={e => updateOffer(i, 'compensation', e.target.value)} placeholder="$100k + Equity" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input value={offer.location} onChange={e => updateOffer(i, 'location', e.target.value)} placeholder="Remote / NY" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Other Notes</Label>
                  <Input value={offer.notes} onChange={e => updateOffer(i, 'notes', e.target.value)} placeholder="Great benefits" className="h-8 text-sm" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            {offers.length < 4 && <Button variant="outline" onClick={handleAddOffer}>+ Add Offer</Button>}
            <Button onClick={handleCompare} disabled={loading}>{loading ? 'Analyzing...' : 'Generate Questions'}</Button>
          </div>

          {questions.length > 0 && (
            <div className="mt-6 bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">What you should ask before deciding:</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close & Delete Session</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
