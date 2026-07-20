import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminScamPatterns: React.FC = () => {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPattern, setNewPattern] = useState({ patternText: '', matchType: 'regex', severity: 'high' });

  const fetchPatterns = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/scam-patterns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPatterns(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleCreate = async () => {
    if (!newPattern.patternText) return;
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/scam-patterns`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newPattern)
      });
      if (res.ok) {
        toast.success("Scam pattern rule created");
        setNewPattern({ patternText: '', matchType: 'regex', severity: 'high' });
        fetchPatterns();
      } else {
        toast.error("Failed to create rule");
      }
    } catch (err) {
      toast.error("Error creating rule");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/scam-patterns/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      if (res.ok) {
        toast.success(`Rule ${!isActive ? 'activated' : 'deactivated'}`);
        fetchPatterns();
      }
    } catch (err) {
      toast.error("Error updating rule");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-600" /> Add Fraud & Scam Rule</CardTitle>
          <CardDescription>Create automated rules to flag suspicious scholarship submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Pattern / Keyword</Label>
              <Input 
                placeholder="e.g., /guaranteed\s+approval/i or 'processing fee'"
                value={newPattern.patternText}
                onChange={(e) => setNewPattern({ ...newPattern, patternText: e.target.value })}
              />
            </div>
            <div className="w-full md:w-48 space-y-2">
              <Label>Match Type</Label>
              <Select value={newPattern.matchType} onValueChange={(v) => setNewPattern({ ...newPattern, matchType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regex">Regex</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-32 space-y-2">
              <Label>Severity</Label>
              <Select value={newPattern.severity} onValueChange={(v) => setNewPattern({ ...newPattern, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={creating || !newPattern.patternText} className="bg-red-600 hover:bg-red-700">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Add Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Scam Patterns</CardTitle>
          <CardDescription>Currently enforced rules across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-md">
              No active scam rules found.
            </div>
          ) : (
            <div className="space-y-3">
              {patterns.map(p => (
                <div key={p._id} className="flex flex-col md:flex-row items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block mb-1">{p.patternText}</div>
                    <div className="text-xs text-muted-foreground flex gap-3">
                      <span>Type: {p.matchType}</span>
                      <span className={p.severity === 'high' ? 'text-red-600 font-semibold' : ''}>Severity: {p.severity}</span>
                      <span>By: {p.createdBy?.name || 'System'}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(p._id, p.isActive)} className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-2 md:mt-0">
                    <Trash2 className="h-4 w-4 mr-2" /> {p.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
