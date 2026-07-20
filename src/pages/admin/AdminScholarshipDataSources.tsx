import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Database, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminScholarshipDataSources = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Form state
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    apiEndpoint: '',
    authMethod: 'bearer',
    syncFrequency: 'daily',
    verifiedApiDocUrl: ''
  });
  const [isApiConfirmed, setIsApiConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/scholarship-data-sources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSources(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/scholarship-data-sources`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Data source created successfully. It is inactive by default.');
        setOpen(false);
        fetchSources();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create data source');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    if (!currentActive) {
        if (!window.confirm("Are you sure you want to ACTIVATE this data source? It will begin syncing immediately upon next scheduled run.")) return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/scholarship-data-sources/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) {
        toast.success(`Source ${!currentActive ? 'activated' : 'deactivated'}`);
        fetchSources();
      }
    } catch (err) {
      toast.error('Failed to toggle source status');
    }
  };

  const triggerSync = async (id: string) => {
    setSyncingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/scholarship-data-sources/${id}/trigger-sync-now`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Sync completed successfully');
      } else {
        const err = await res.json();
        toast.error(`Sync failed: ${err.message || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error('Sync request failed');
    } finally {
      setSyncingId(null);
      fetchSources();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scholarship Data Sources</h1>
            <p className="text-muted-foreground">Manage official API integrations for automatic scholarship syndication.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Database className="h-4 w-4 mr-2" /> Add Data Source</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Configure Data Source API</DialogTitle>
              </DialogHeader>
              
              <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-md flex gap-3 text-yellow-800 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <div>
                  <strong className="block mb-1">Anti-Scraping Compliance</strong>
                  <p>This form is strictly for configuring genuine, confirmed public or partner APIs. <strong>Web scraping aggregator sites (e.g., Buddy4Study, Scholarships.com) without a public API is prohibited.</strong> You must provide a verified API documentation URL.</p>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Source Name</label>
                  <Input 
                    required 
                    placeholder="e.g., Federal Student Aid API"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">API Endpoint</label>
                  <Input 
                    required 
                    type="url"
                    placeholder="https://api.example.gov/v1/scholarships"
                    value={formData.apiEndpoint}
                    onChange={e => setFormData({...formData, apiEndpoint: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Verified API Documentation URL</label>
                  <Input 
                    required 
                    type="url"
                    placeholder="https://developer.example.gov/docs"
                    value={formData.verifiedApiDocUrl}
                    onChange={e => setFormData({...formData, verifiedApiDocUrl: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Must point to the official API integration guide.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Auth Method</label>
                        <select 
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.authMethod}
                            onChange={e => setFormData({...formData, authMethod: e.target.value})}
                        >
                            <option value="none">None (Public)</option>
                            <option value="bearer">Bearer Token</option>
                            <option value="apiKey">API Key (Header)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Sync Frequency</label>
                        <select 
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.syncFrequency}
                            onChange={e => setFormData({...formData, syncFrequency: e.target.value})}
                        >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded border">
                  <Checkbox 
                    id="api-confirm" 
                    checked={isApiConfirmed} 
                    onCheckedChange={(checked) => setIsApiConfirmed(checked === true)}
                  />
                  <label htmlFor="api-confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I confirm this is an official API and NOT a web scraping script.
                  </label>
                </div>

                <Button type="submit" className="w-full mt-4" disabled={submitting || !isApiConfirmed}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Source (Inactive)
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : sources.length === 0 ? (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Database className="h-12 w-12 mb-4 opacity-20" />
                    <p>No scholarship data sources configured.</p>
                </CardContent>
            </Card>
        ) : (
            <div className="grid gap-4">
                {sources.map(source => (
                    <Card key={source._id} className={source.isActive ? 'border-primary/50' : 'opacity-80'}>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {source.name}
                                    <Badge variant={source.isActive ? 'default' : 'secondary'}>
                                        {source.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="font-mono text-xs mt-1">{source.apiEndpoint}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                                <span className="text-sm font-medium mr-2">Activate Source</span>
                                <Switch 
                                    checked={source.isActive} 
                                    onCheckedChange={() => toggleActive(source._id, source.isActive)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4 text-sm bg-muted/30 p-4 rounded-md">
                                <div>
                                    <span className="text-muted-foreground block mb-1">Last Sync Status</span>
                                    {source.lastSyncStatus === 'success' ? (
                                        <span className="flex items-center text-green-600 font-medium"><CheckCircle2 className="h-4 w-4 mr-1" /> Success</span>
                                    ) : source.lastSyncStatus === 'failed' ? (
                                        <span className="flex items-center text-red-600 font-medium"><AlertTriangle className="h-4 w-4 mr-1" /> Failed</span>
                                    ) : (
                                        <span className="text-muted-foreground">Never</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">Last Synced At</span>
                                    <span className="font-medium">{source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-end">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={syncingId === source._id || !source.isActive}
                                        onClick={() => triggerSync(source._id)}
                                    >
                                        {syncingId === source._id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                        Sync Now
                                    </Button>
                                </div>
                            </div>
                            
                            {source.lastSyncStatus === 'failed' && source.lastSyncErrorDetail && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-800">
                                    <span className="font-semibold block mb-1">Sync Error Detail:</span>
                                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">{source.lastSyncErrorDetail}</pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
