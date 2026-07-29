import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from 'sonner';

export const ReferrerOptInModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendOtp = () => {
    if (!company || !role || !batchYear || !workEmail) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    // Simple email domain check mock
    if (!workEmail.includes('@')) {
      toast.error("Please enter a valid work email.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      toast.success("Verification code sent to " + workEmail);
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp === '123456') {
        setStep('success');
      } else {
        toast.error("Verification failed. Incorrect code.");
      }
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        // reset on close
        setTimeout(() => { setStep('form'); setOtp(""); }, 300);
      }
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Become a Verified Referrer
              </DialogTitle>
              <DialogDescription>
                Help juniors by providing referrals. We verify work emails to maintain trust in the network.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Company <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Amazon" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. SDE-1" value={role} onChange={e => setRole(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Batch <span className="text-red-500">*</span></Label>
                  <Select value={batchYear} onValueChange={setBatchYear}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Your work email is only used for one-time verification and will never be shared publicly or spammed.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Work Email <span className="text-red-500">*</span></Label>
                  <Input 
                    type="email" 
                    placeholder="e.g. name@amazon.com" 
                    value={workEmail} 
                    onChange={e => setWorkEmail(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>LinkedIn Profile URL <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <Input 
                    placeholder="https://linkedin.com/in/..." 
                    value={linkedin} 
                    onChange={e => setLinkedin(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSendOtp} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Verification Code
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'otp' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" /> Verify your Email
              </DialogTitle>
              <DialogDescription>
                We sent a 6-digit verification code to <span className="font-semibold text-foreground">{workEmail}</span>.
                (Mock Note: Enter "123456" to succeed).
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Input 
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 max-w-[250px]"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('form')} className="mr-auto">Back</Button>
              <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify & Opt-In
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">You're Verified!</h2>
            <p className="text-muted-foreground max-w-sm">
              Your profile now has a verified badge. You can view your incoming referral requests in the Dashboard inbox.
            </p>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>Go to Inbox</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
