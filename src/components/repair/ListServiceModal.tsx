import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface ListServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ListServiceModal = ({ open, onOpenChange }: ListServiceModalProps) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState("");

  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    contactPhone: "",
    contactEmail: "",
    serviceArea: "",
    description: ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${API_URL}/api/repair/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      setReferenceId(data.data.referenceId);
      setStep(2); // Success screen
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setFormData({
        businessName: "",
        category: "",
        contactPhone: "",
        contactEmail: "",
        serviceArea: "",
        description: ""
      });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>List Your Service</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Submit your details and we'll review your application to join the directory."
              : "Application Submitted Successfully"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Business / Provider Name</Label>
              <Input 
                required 
                value={formData.businessName} 
                onChange={(e) => handleChange("businessName", e.target.value)} 
                placeholder="e.g. Acme Plumbing" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Primary Category</Label>
              <Select required value={formData.category} onValueChange={(val) => handleChange("category", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Handyman">Handyman</SelectItem>
                  <SelectItem value="AC & Appliances">AC & Appliances</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input 
                  required 
                  type="tel"
                  value={formData.contactPhone} 
                  onChange={(e) => handleChange("contactPhone", e.target.value)} 
                  placeholder="Phone number" 
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input 
                  required 
                  type="email"
                  value={formData.contactEmail} 
                  onChange={(e) => handleChange("contactEmail", e.target.value)} 
                  placeholder="Email address" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Area (Campus / City)</Label>
              <Input 
                required 
                value={formData.serviceArea} 
                onChange={(e) => handleChange("serviceArea", e.target.value)} 
                placeholder="e.g. North Campus & Downtown" 
              />
            </div>

            <div className="space-y-2">
              <Label>Brief Description of Services</Label>
              <Textarea 
                required 
                value={formData.description} 
                onChange={(e) => handleChange("description", e.target.value)} 
                placeholder="Tell us what you do..."
                className="min-h-[100px]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">We've received your details!</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Our team will review your application and reach out to you soon. Please save your reference ID for your records.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50 w-full mb-6">
              <p className="text-sm text-muted-foreground mb-1">Reference ID</p>
              <p className="font-mono text-lg font-bold text-white tracking-wider">{referenceId}</p>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
