import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ScholarshipSubmit() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    provider: '',
    description: '',
    applicationDeadline: '',
    amountMin: '',
    applicationUrl: '',
    sourceUrl: '', // Phase 11
    linkedJobId: '', // Phase 4 addition
  });
  const [submissionType, setSubmissionType] = useState('student');
  const [apiCompliant, setApiCompliant] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title,
        provider: formData.provider,
        description: formData.description,
        applicationDeadline: formData.applicationDeadline,
        amount: { min: parseInt(formData.amountMin) || 0 },
        amountType: 'fixed',
        applicationMode: 'external_link',
        externalUrl: formData.applicationUrl,
        sourceUrl: formData.sourceUrl || formData.applicationUrl,
        linkedJobId: formData.linkedJobId || undefined,
        managedByInstitution: submissionType === 'provider', // Backend infers this as provider-managed
      };

      if (!apiCompliant) {
        toast.error("You must confirm this is an official API/non-scraping submission.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/scholarships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Your scholarship has been submitted for review. It will be publicly visible once approved by our moderation team.');
        navigate('/scholarships');
      } else if (res.status === 429) {
        const err = await res.json();
        toast.error(`You have reached your submission limit. ${err.message || 'Please try again later.'}`);
      } else {
        toast.error('Failed to submit scholarship');
      }
    } catch (err) {
      toast.error('Error submitting scholarship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Submit a Scholarship</CardTitle>
            <CardDescription>
                Add a new scholarship to the community database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={submissionType} onValueChange={setSubmissionType} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="student">I'm a Student (Community Find)</TabsTrigger>
                    <TabsTrigger value="provider">I'm the Provider/Institution</TabsTrigger>
                </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div>
                <Label>Provider</Label>
                <Input value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div>
                <Label>Application Deadline</Label>
                <Input type="date" value={formData.applicationDeadline} onChange={e => setFormData({...formData, applicationDeadline: e.target.value})} required />
              </div>
              <div>
                <Label>Amount (Minimum)</Label>
                <Input type="number" value={formData.amountMin} onChange={e => setFormData({...formData, amountMin: e.target.value})} required />
              </div>
              <div>
                <Label>Application URL</Label>
                <Input type="url" value={formData.applicationUrl} onChange={e => setFormData({...formData, applicationUrl: e.target.value})} />
              </div>
              <div>
                <Label>Where did you find this scholarship? (Original Source URL)</Label>
                <Input type="url" value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} required placeholder="Link to the official scholarship page" />
                <p className="text-sm text-muted-foreground mt-1">Provide the official webpage where this scholarship is listed to help admins verify its authenticity.</p>
              </div>
              <div>
                <Label>Linked Job ID (Optional, for Employer Fast-Track)</Label>
                <Input value={formData.linkedJobId} onChange={e => setFormData({...formData, linkedJobId: e.target.value})} placeholder="e.g. 60d21b4667d0d8992e610c85" />
                <p className="text-sm text-muted-foreground mt-1">If this scholarship is sponsored by a verified employer and tied to a hiring pipeline.</p>
              </div>

              <div className="flex items-start space-x-2 p-4 bg-muted/30 rounded-md border">
                <Checkbox id="compliance" checked={apiCompliant} onCheckedChange={(c) => setApiCompliant(c === true)} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="compliance" className="font-semibold text-sm">Official API/Non-Scraping Compliance (Phase 11)</Label>
                  <p className="text-xs text-muted-foreground">
                    I confirm this data is submitted via authorized channels or manual entry, and no automated web scraping was used to retrieve it.
                  </p>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || !apiCompliant}>
                {loading ? 'Submitting...' : 'Submit Scholarship'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
