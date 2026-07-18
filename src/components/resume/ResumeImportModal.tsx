import React, { useState } from 'react';
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
