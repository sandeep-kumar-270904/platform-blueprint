import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ComplianceSectionProps {
  applicationId: string;
}

export const ComplianceSection: React.FC<ComplianceSectionProps> = ({ applicationId }) => {
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [proofText, setProofText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchChecks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/compliance-checks/application/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setChecks(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, [applicationId]);

  const handleSubmitProof = async () => {
    if (!selectedCheck) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/compliance-checks/${selectedCheck._id}/submit-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: proofText })
      });
      if (res.ok) {
        toast.success("Proof submitted successfully");
        setSubmitModalOpen(false);
        fetchChecks();
      } else {
        toast.error("Failed to submit proof");
      }
    } catch (err) {
      toast.error("Error submitting proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (checks.length === 0) return null; // Only show section if there are checks

  return (
    <div className="mt-4 border-t pt-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Post-Award Compliance</h4>
      </div>
      <div className="space-y-3">
        {checks.map(check => (
          <div key={check._id} className="bg-muted/50 p-3 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Due: {format(new Date(check.dueDate), 'MMM d, yyyy')}</span>
                {check.status === 'verified' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1"/> Verified</Badge>}
                {check.status === 'at_risk' && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1"/> Action Required</Badge>}
                {check.status === 'submitted' && <Badge variant="secondary">Under Review</Badge>}
                {check.status === 'pending' && <Badge variant="outline">Pending Submission</Badge>}
              </div>
              {check.status === 'at_risk' && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  Provider flagged this as at risk. Please resubmit your proof.
                </p>
              )}
            </div>
            
            {(check.status === 'pending' || check.status === 'at_risk') && (
              <Button size="sm" onClick={() => { setSelectedCheck(check); setSubmitModalOpen(true); }}>
                <Upload className="h-3 w-3 mr-2" /> Submit Proof
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Compliance Proof</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description / Link</Label>
              <Textarea 
                placeholder="Provide a link to your transcript, receipt, or describe how you met the requirement..."
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                rows={4}
              />
            </div>
            {/* Note: File upload would go here in a full implementation, simulating with text for now */}
            <div className="border border-dashed p-4 text-center rounded-md text-sm text-muted-foreground cursor-not-allowed">
              <FileText className="h-4 w-4 mx-auto mb-2 opacity-50" />
              File uploads (PDF, Image) mock disabled for this environment.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitProof} disabled={!proofText || submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
