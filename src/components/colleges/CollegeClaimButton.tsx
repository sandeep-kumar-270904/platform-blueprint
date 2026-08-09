import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CollegeClaimButtonProps {
  collegeId: string;
}

export const CollegeClaimButton: React.FC<CollegeClaimButtonProps> = ({ collegeId }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    officialEmail: '',
    proofDocumentUrl: ''
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`${API_URL}/api/colleges/${collegeId}/official-status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setStatus(res.data.status);
      } catch (err) {
        console.error("Failed to check official status");
      }
    };
    checkStatus();
  }, [collegeId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to claim this page');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/colleges/${collegeId}/claim`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Claim submitted successfully. Awaiting admin review.');
      setStatus('pending');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (status === 'approved') {
    return (
      <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary hover:bg-primary/20 pointer-events-none">
        <ShieldCheck className="h-4 w-4 mr-2" /> Official Representative
      </Button>
    );
  }

  if (status === 'pending') {
    return (
      <Button variant="outline" size="sm" disabled>
        Claim Pending Review
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCheck className="h-4 w-4 mr-2" /> Claim this Page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Claim Official College Page</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="officialEmail">Official Institution Email *</Label>
            <Input 
              id="officialEmail" 
              type="email" 
              placeholder="name@college.edu" 
              required 
              value={formData.officialEmail}
              onChange={(e) => setFormData({...formData, officialEmail: e.target.value})}
            />
            <p className="text-xs text-muted-foreground">Must be a domain matching the institution.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proofUrl">Proof Document URL</Label>
            <Input 
              id="proofUrl" 
              type="url" 
              placeholder="https://link-to-id-card-or-letter" 
              value={formData.proofDocumentUrl}
              onChange={(e) => setFormData({...formData, proofDocumentUrl: e.target.value})}
            />
            <p className="text-xs text-muted-foreground">Provide a link to an authorization letter or staff ID.</p>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
