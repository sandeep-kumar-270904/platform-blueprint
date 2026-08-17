import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, MessageCircle, HelpCircle, Calendar } from 'lucide-react';

interface ConnectionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alumniProfile: any;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ConnectionRequestDialog: React.FC<ConnectionRequestDialogProps> = ({ open, onOpenChange, alumniProfile }) => {
  const [type, setType] = useState<'qa' | 'relay' | 'session_1on1'>('qa');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message or question.');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/alumni/connections/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alumniProfileId: alumniProfile._id,
          type,
          message,
          isAnonymous: type === 'qa' ? isAnonymous : false
        })
      });

      if (res.ok) {
        toast.success('Request sent successfully!');
        onOpenChange(false);
        setMessage('');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to send request');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  if (!alumniProfile) return null;

  const canQA = alumniProfile.willingness?.openToQa;
  const canMentor = alumniProfile.willingness?.openToMentoring;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect with {alumniProfile.userId?.full_name}</DialogTitle>
          <DialogDescription>
            Choose how you would like to interact. All communications are moderated and private. Contact info is never shared.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col gap-3">
            {canQA && (
              <Button 
                variant={type === 'qa' ? 'default' : 'outline'} 
                className="justify-start h-auto py-3"
                onClick={() => setType('qa')}
              >
                <HelpCircle className="w-5 h-5 mr-3 text-blue-500" />
                <div className="text-left">
                  <div className="font-semibold">Public Q&A</div>
                  <div className="text-xs font-normal opacity-80">Ask a question. The answer will be public.</div>
                </div>
              </Button>
            )}
            
            {canMentor && (
              <>
                <Button 
                  variant={type === 'relay' ? 'default' : 'outline'} 
                  className="justify-start h-auto py-3"
                  onClick={() => setType('relay')}
                >
                  <MessageCircle className="w-5 h-5 mr-3 text-green-500" />
                  <div className="text-left">
                    <div className="font-semibold">Private Message (Relay)</div>
                    <div className="text-xs font-normal opacity-80">Send a private question. Replies go to your inbox.</div>
                  </div>
                </Button>
                
                <Button 
                  variant={type === 'session_1on1' ? 'default' : 'outline'} 
                  className="justify-start h-auto py-3"
                  onClick={() => setType('session_1on1')}
                >
                  <Calendar className="w-5 h-5 mr-3 text-purple-500" />
                  <div className="text-left">
                    <div className="font-semibold">Request 1:1 Session</div>
                    <div className="text-xs font-normal opacity-80">Propose a topic. If accepted, a virtual room is created.</div>
                  </div>
                </Button>
              </>
            )}
          </div>

          <div className="space-y-3">
            <Label>
              {type === 'qa' ? 'Your Question' : type === 'relay' ? 'Your Private Message' : 'Proposed Topic & Details'}
            </Label>
            <Textarea 
              placeholder="Be polite and specific..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {type === 'qa' && (
            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border">
              <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="anonymous" className="flex flex-col cursor-pointer">
                <span className="font-semibold">Ask Anonymously</span>
                <span className="text-xs text-muted-foreground">Hide your name from the public feed (Alumni can still see it).</span>
              </Label>
            </div>
          )}

          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded flex items-start gap-2">
            <Shield className="w-5 h-5 mt-0.5 shrink-0" />
            <p><strong>Privacy Promise:</strong> Your email, phone number, and social handles are hidden. All responses happen safely within the platform.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
