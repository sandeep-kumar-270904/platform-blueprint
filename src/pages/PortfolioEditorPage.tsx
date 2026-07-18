import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Save, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const PortfolioEditorPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resumesRes, portfolioRes] = await Promise.all([
        api.get('/resumes'),
        api.get('/portfolios/my-portfolio').catch(e => {
          if (e.response?.status === 404) return { data: null };
          throw e;
        })
      ]);
      setResumes(resumesRes.data);
      if (portfolioRes.data) {
        setPortfolio(portfolioRes.data);
      } else {
        setPortfolio({
          slug: user?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || '',
          syncMode: 'independent',
          theme: 'modern',
          isPublished: false,
          resumeId: resumesRes.data.length > 0 ? resumesRes.data[0]._id : ''
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load portfolio data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  
  const handlePullNarrative = async (blockIndex: number) => {
    try {
      const token = localStorage.getItem('token');
      // If we don't have the draft loaded, we can fetch the resume narrative
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${portfolio?.resumeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.narrativeDraft) {
        updateCustomBlock(blockIndex, 'richTextContent', data.narrativeDraft);
        toast.success("Draft pulled from Resume Narrative");
      } else {
        toast("No narrative draft found on the linked resume.");
      }
    } catch (e) {
      toast.error("Failed to pull narrative");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/portfolios/my-portfolio', portfolio);
      setPortfolio(res.data);
      toast({ title: 'Success', description: 'Portfolio saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/resume-builder')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </Button>
          <div className="flex gap-2">
            {portfolio.isPublished && (
              <Button variant="outline" onClick={() => window.open(`/portfolio/${portfolio.slug}`, '_blank')} className="gap-2">
                <ExternalLink className="h-4 w-4" /> View Live
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Portfolio
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Settings</CardTitle>
              <CardDescription>Configure your public presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <h4 className="font-semibold">Publish Portfolio</h4>
                  <p className="text-sm text-muted-foreground">Make your portfolio visible to everyone</p>
                </div>
                <Switch 
                  checked={portfolio.isPublished} 
                  onCheckedChange={v => setPortfolio({ ...portfolio, isPublished: v })} 
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Slug URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">studenthub.com/portfolio/</span>
                  <Input 
                    value={portfolio.slug} 
                    onChange={e => setPortfolio({ ...portfolio, slug: e.target.value })} 
                    placeholder="your-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={portfolio.theme} onValueChange={v => setPortfolio({ ...portfolio, theme: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern Professional</SelectItem>
                    <SelectItem value="creative">Creative Bold</SelectItem>
                    <SelectItem value="minimal">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Synchronization</CardTitle>
              <CardDescription>How should your portfolio content be managed?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sync Mode</Label>
                <Select value={portfolio.syncMode} onValueChange={v => setPortfolio({ ...portfolio, syncMode: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sync-from-resume">Sync from Resume (Auto-updates)</SelectItem>
                    <SelectItem value="independent">Independent (Manual editing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {portfolio.syncMode === 'sync-from-resume' && (
                <div className="space-y-2 bg-blue-50/50 p-4 rounded-md border border-blue-100">
                  <Label>Source Resume</Label>
                  <Select value={portfolio.resumeId} onValueChange={v => setPortfolio({ ...portfolio, resumeId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resume to sync from" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map(r => (
                        <SelectItem key={r._id} value={r._id}>{r.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-blue-700 mt-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    When you update this resume, your portfolio will automatically reflect the changes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {portfolio.syncMode === 'independent' && (
            <Card>
              <CardHeader>
                <CardTitle>Independent Content Editor</CardTitle>
                <CardDescription>Manually add blocks and sections</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">Content editor modules go here...</p>
                {/* Simplified for time, usually would include a rich text editor or array mapping for custom sections */}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioEditorPage;
