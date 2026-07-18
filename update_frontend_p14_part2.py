import os
import re

import_modal = "src/components/resume/ResumeImportModal.tsx"
if os.path.exists(import_modal):
    with open(import_modal, "r", encoding="utf-8") as f:
        content = f.read()

    # The backend will now return { personalInfo, experience, ..., confidenceFlags }
    # Let's add a state to hold confidence flags and display a warning.
    flags_state = """
  const [confidenceFlags, setConfidenceFlags] = useState<any>(null);
"""
    if "setConfidenceFlags" not in content:
        content = content.replace(
            "const [loading, setLoading] = useState(false);",
            "const [loading, setLoading] = useState(false);\n  const [confidenceFlags, setConfidenceFlags] = useState<any>(null);"
        )

        content = content.replace(
            "onImport(data);",
            "if (data.confidenceFlags) setConfidenceFlags(data.confidenceFlags);\n      onImport(data);"
        )

        warning_ui = """
          {confidenceFlags && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">
              <span className="font-semibold">⚠️ Double-check needed:</span> Some fields were hard to read from your file. Please manually review sections marked as low confidence (e.g. {Object.entries(confidenceFlags).filter(([k,v]) => v === 'low').map(([k,v]) => k).join(', ')}).
            </div>
          )}
"""
        content = re.sub(
            r'(<div className="flex justify-end gap-2">)',
            warning_ui + r'\n          \1',
            content
        )
        
        with open(import_modal, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated ResumeImportModal.tsx with confidenceFlags")
else:
    print("ResumeImportModal.tsx not found. Creating it.")
    new_modal = """import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function ResumeImportModal({ onImport, onClose }: { onImport: (data: any) => void, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [confidenceFlags, setConfidenceFlags] = useState<any>(null);
  const { token } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', e.target.files[0]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.confidenceFlags) setConfidenceFlags(data.confidenceFlags);
      onImport(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full">
        <CardHeader><CardTitle>Import Legacy Resume</CardTitle></CardHeader>
        <CardContent>
          <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleUpload} disabled={loading} />
          {loading && <p className="mt-2 text-sm">Processing... Gemini 1.5 is reading your file...</p>}
          
          {confidenceFlags && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">
              <span className="font-semibold">⚠️ Double-check needed:</span> Some fields were hard to read from your file. Please manually review sections marked as low confidence (e.g. {Object.entries(confidenceFlags).filter(([k,v]) => v === 'low').map(([k,v]) => k).join(', ')}).
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
"""
    with open("src/components/resume/ResumeImportModal.tsx", "w", encoding="utf-8") as f:
        f.write(new_modal)
    print("Created ResumeImportModal.tsx")

# Let's also create TemplateSelector.tsx logic
template_selector = "src/components/resume/TemplateSelector.tsx"
if not os.path.exists(template_selector):
    with open(template_selector, "w", encoding="utf-8") as f:
        f.write("""import React, { useState, useEffect } from 'react';
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
""")
    print("Created TemplateSelector.tsx")

