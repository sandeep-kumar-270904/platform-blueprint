import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Key, Trash2, Copy, AlertTriangle } from "lucide-react";

export const DeveloperSettings: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [newTokenName, setNewTokenName] = useState('');
  const [selectedResume, setSelectedResume] = useState('');
  
  const { token } = useAuth();

  const fetchTokens = async () => {
    try {
      const [tokenRes, resumeRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dev/tokens`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (tokenRes.ok) setTokens(await tokenRes.json());
      if (resumeRes.ok) {
        const data = await resumeRes.json();
        setResumes(data);
        if (data.length > 0) setSelectedResume(data[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTokens();
  }, [token]);

  const handleGenerate = async () => {
    if (!newTokenName || !selectedResume) return;
    setGenerating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dev/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newTokenName, resumeId: selectedResume })
      });
      if (res.ok) {
        setNewTokenName('');
        fetchTokens();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dev/token/${id}/revoke`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchTokens();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Developer API Access</h2>
        <p className="text-muted-foreground">Generate scoped read-only tokens to use your resume data in personal projects or portfolios.</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900 p-4 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p>Tokens provide direct JSON access to your resume data via <code>GET /api/dev/public/resume-data</code>. Keep these tokens secret. Anyone with a token can read the linked resume's content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Token Name</label>
              <Input placeholder="e.g. My Personal Website" value={newTokenName} onChange={e => setNewTokenName(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Target Resume</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
                {resumes.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={generating || !newTokenName}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Key className="h-4 w-4 mr-2"/>} Generate API Token
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold">Active Tokens</h3>
        {tokens.length === 0 && <p className="text-sm text-muted-foreground">No active API tokens found.</p>}
        {tokens.map(t => (
          <Card key={t._id} className={t.revoked ? "opacity-50" : ""}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{t.name}</h4>
                <p className="text-xs text-muted-foreground">Resume: {t.resumeId?.title} • Usage: {t.usageCount} requests</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs bg-muted p-1 rounded font-mono">{t.revoked ? 'REVOKED' : t.tokenHash}</code>
                </div>
              </div>
              {!t.revoked && (
                <Button variant="destructive" size="sm" onClick={() => handleRevoke(t._id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Revoke
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
