import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface BecomeMentorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BecomeMentorModal = ({ open, onOpenChange }: BecomeMentorModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    bio: "",
    expertise: "", // comma separated
    yearsOfExperience: 0,
    languages: "English",
    pricePerHour: 0
  });

  useEffect(() => {
    if (open && user) {
      checkExistingProfile();
    }
  }, [open, user]);

  const checkExistingProfile = async () => {
    setCheckingStatus(true);
    try {
      const currentToken = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/me/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExistingProfile(data);
      } else {
        setExistingProfile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: "Error", description: "You must be logged in to apply", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        expertise: formData.expertise.split(',').map(e => e.trim()).filter(Boolean),
        languages: formData.languages.split(',').map(e => e.trim()).filter(Boolean)
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/mentors/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit application");
      }

      toast({
        title: "Application Submitted!",
        description: "Your mentor profile is now pending admin approval."
      });
      
      setExistingProfile(data.mentor);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Become a Mentor</DialogTitle>
            <DialogDescription>Please sign in first to apply as a mentor.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Become a Mentor</DialogTitle>
          <DialogDescription>
            Share your expertise and guide the next generation of professionals.
          </DialogDescription>
        </DialogHeader>

        {checkingStatus ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : existingProfile ? (
          <div className="py-6 text-center">
            <h3 className="font-semibold text-lg mb-2">Application Status</h3>
            <p className="text-muted-foreground mb-4">
              Your profile is currently <strong className="capitalize">{existingProfile.verificationStatus}</strong>.
            </p>
            {existingProfile.verificationStatus === 'pending' && (
              <p className="text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
                We are reviewing your application. You will be notified once it is approved.
              </p>
            )}
            {existingProfile.verificationStatus === 'approved' && (
              <p className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg">
                You are an approved mentor! Visit your Dashboard to manage your profile and sessions.
              </p>
            )}
            {existingProfile.verificationStatus === 'rejected' && (
              <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                Your application was rejected. Reason: {existingProfile.rejectionReason}
              </p>
            )}
            <Button className="mt-6" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Professional Title <span className="text-red-500">*</span></Label>
                <Input required placeholder="e.g. Senior Software Engineer" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input placeholder="e.g. Google" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio <span className="text-red-500">*</span></Label>
              <Textarea required placeholder="Tell mentees about yourself..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label>Expertise Tags (comma separated) <span className="text-red-500">*</span></Label>
              <Input required placeholder="React, Node.js, System Design" value={formData.expertise} onChange={e => setFormData({...formData, expertise: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input type="number" min="0" value={formData.yearsOfExperience} onChange={e => setFormData({...formData, yearsOfExperience: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Price Per Hour (₹) <span className="text-muted-foreground text-xs font-normal">(0 for free)</span></Label>
                <Input type="number" min="0" value={formData.pricePerHour} onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Languages (comma separated)</Label>
              <Input placeholder="English, Hindi" value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
