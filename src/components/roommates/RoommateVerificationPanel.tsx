import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, ShieldCheck, Mail, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { VerificationStatus } from './RoommateVerificationBadge';

interface RoommateVerificationPanelProps {
  currentStatus: VerificationStatus;
  onStatusChange: (newStatus: VerificationStatus) => void;
}

export const RoommateVerificationPanel: React.FC<RoommateVerificationPanelProps> = ({ currentStatus, onStatusChange }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPendingId, setHasPendingId] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check pending ID status on mount
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/verification/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHasPendingId(data.hasPendingIdReview);
        if (data.verificationStatus !== currentStatus) {
          onStatusChange(data.verificationStatus);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestEmailCode = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/verification/request-email-code`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCodeSent(true);
        toast({ title: "Code Sent", description: data.message });
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailCode = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/verification/confirm-email-code`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Verified", description: data.message });
        onStatusChange(data.verificationStatus);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadId = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/uploads/evidence`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');
      
      const photoUrl = uploadData.url;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/verification/request-id-review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ idPhotoUrl: photoUrl })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "ID Submitted", description: data.message });
        setHasPendingId(true);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Trust & Verification</h2>
        </div>
        {currentStatus === 'id_verified' && <Badge className="bg-amber-500 hover:bg-amber-600">ID Verified</Badge>}
        {currentStatus === 'email_verified' && <Badge className="bg-blue-500 hover:bg-blue-600">Email Verified</Badge>}
        {currentStatus === 'none' && <Badge variant="secondary">Unverified</Badge>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Email Verification Card */}
        <Card className={currentStatus === 'email_verified' || currentStatus === 'id_verified' ? 'border-primary/50 bg-primary/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> College Email
            </CardTitle>
            <CardDescription>
              Verify your student email address to get the Email Verified badge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStatus === 'email_verified' || currentStatus === 'id_verified' ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium p-4 bg-green-50 dark:bg-green-950/30 rounded-md">
                <CheckCircle className="w-5 h-5" /> Email successfully verified.
              </div>
            ) : isCodeSent ? (
              <div className="space-y-4">
                <Input 
                  type="text" 
                  placeholder="Enter 6-digit code" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  maxLength={6}
                />
                <Button onClick={handleConfirmEmailCode} disabled={loading || code.length < 6} className="w-full">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input 
                  type="email" 
                  placeholder="e.g. name@university.edu" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <Button onClick={handleRequestEmailCode} disabled={loading || !email} className="w-full">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Verification Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ID Verification Card */}
        <Card className={currentStatus === 'id_verified' ? 'border-amber-500/50 bg-amber-500/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> Student ID
            </CardTitle>
            <CardDescription>
              Upload a photo of your Student ID for manual review to get the highest trust badge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStatus === 'id_verified' ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-medium p-4 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                <ShieldCheck className="w-5 h-5" /> ID successfully verified.
              </div>
            ) : hasPendingId ? (
              <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/50 rounded-md border border-dashed">
                <Loader2 className="w-4 h-4 animate-spin" /> Pending admin review.
              </div>
            ) : (
              <div className="space-y-4">
                <label className="p-8 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Click to upload photo of Student ID</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="id-upload"
                    accept="image/*,application/pdf" 
                    onChange={handleUploadId} 
                    disabled={loading} 
                  />
                </label>
                <Button 
                  onClick={() => document.getElementById('id-upload')?.click()} 
                  disabled={loading} 
                  variant="secondary" 
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Select File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
