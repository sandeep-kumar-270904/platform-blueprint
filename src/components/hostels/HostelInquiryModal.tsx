import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar } from "lucide-react";
import { Hostel } from "@/hooks/useHostels";
import { useSendInquiry } from "@/hooks/useHostelInquiries";

interface HostelInquiryModalProps {
  hostel: Hostel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HostelInquiryModal = ({ hostel, open, onOpenChange }: HostelInquiryModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const sendInquiry = useSendInquiry();

  const [formData, setFormData] = useState({
    name: "",
    preferredRoomType: "",
    moveInDate: "",
    message: ""
  });

  useEffect(() => {
    if (user && open) {
      setFormData(prev => ({ ...prev, name: user.name || "" }));
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await sendInquiry.mutateAsync({
        hostelId: hostel._id,
        senderId: user._id || user.id,
        ownerId: hostel.ownerId,
        ...formData
      });

      toast({
        title: "Inquiry Sent!",
        description: "Your inquiry has been sent to the hostel owner.",
      });
      onOpenChange(false);
      setFormData(prev => ({ ...prev, preferredRoomType: "", moveInDate: "", message: "" }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact {hostel.name}</DialogTitle>
          <DialogDescription>
            Send a booking inquiry directly to the hostel owner.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Full Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Room</Label>
              <Select 
                required
                value={formData.preferredRoomType} 
                onValueChange={(val) => setFormData({...formData, preferredRoomType: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {hostel.roomTypes.map((rt, i) => (
                    <SelectItem key={i} value={rt.type} className="capitalize">
                      {rt.type} Room
                    </SelectItem>
                  ))}
                  <SelectItem value="Any">Any Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Move-in Date</Label>
              <div className="relative">
                <Input 
                  required 
                  type="date"
                  value={formData.moveInDate}
                  onChange={e => setFormData({...formData, moveInDate: e.target.value})}
                  className="pl-9"
                  min={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Textarea 
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              placeholder="Any specific questions or requirements?"
              className="h-24 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendInquiry.isPending}>
              {sendInquiry.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Inquiry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
