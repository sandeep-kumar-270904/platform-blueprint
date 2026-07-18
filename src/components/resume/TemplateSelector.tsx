import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export default function TemplateSelector() {
  const { token, user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', layoutCode: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(setTemplates).catch(console.error);
    }
  }, [token]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/templates/community`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      alert('Template submitted for admin review!');
      setNewTemplate({ name: '', layoutCode: '' });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader><CardTitle>Community Template Marketplace</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {templates.filter(t => t.isApproved).map(t => (
              <div key={t._id} className="border p-3 rounded">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-sm text-muted-foreground">Used {t.usageCount || 0} times</p>
                <Button size="sm" className="mt-2" variant="outline">Preview</Button>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold mb-4">Submit Your Own Template</h3>
            <div className="space-y-4 max-w-md">
              <Input placeholder="Template Name" value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
              <textarea 
                className="w-full border rounded p-2 text-sm font-mono h-32" 
                placeholder="HTML/CSS Layout Code"
                value={newTemplate.layoutCode}
                onChange={e => setNewTemplate({...newTemplate, layoutCode: e.target.value})}
              />
              <Button onClick={handleSubmit} disabled={loading}>Submit for Review</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
