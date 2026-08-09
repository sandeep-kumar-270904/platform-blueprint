import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface StructuredRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumniId: string; // The AlumniProfile._id
  alumniName: string;
}

export const StructuredRequestModal: React.FC<StructuredRequestModalProps> = ({ isOpen, onClose, alumniId, alumniName }) => {
  const [intent, setIntent] = useState('Career guidance');
  const [interactionType, setInteractionType] = useState('qa');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const generateWithAI = async () => {
    try {
      setGeneratingAI(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ai/connection-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          intent,
          alumniName,
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        toast.success('AI draft generated!');
      } else {
        throw new Error('Failed to generate message');
      }
    } catch (err) {
      toast.error('AI generation failed. Please write your message manually.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please add a message');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alumni/connections/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alumniProfileId: alumniId,
          type: interactionType,
          intent,
          message,
          isAnonymous,
          requestedDate: interactionType === 'session_1on1' ? requestedDate : undefined,
          requestedTime: interactionType === 'session_1on1' ? requestedTime : undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to send request');
      }

      toast.success('Connection request sent!');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect with {alumniName}</DialogTitle>
          <DialogDescription>
            Send a structured request. Be clear about what you are looking for.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>What do you need help with?</Label>
                <Select value={intent} onValueChange={setIntent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Career guidance">Career guidance</SelectItem>
                    <SelectItem value="Technical guidance">Technical guidance</SelectItem>
                    <SelectItem value="Resume review">Resume review</SelectItem>
                    <SelectItem value="Interview preparation">Interview preparation</SelectItem>
                    <SelectItem value="Project feedback">Project feedback</SelectItem>
                    <SelectItem value="Internship guidance">Internship guidance</SelectItem>
                    <SelectItem value="Higher studies">Higher studies</SelectItem>
                    <SelectItem value="Company information">Company information</SelectItem>
                    <SelectItem value="Startup advice">Startup advice</SelectItem>
                    <SelectItem value="Mentorship">Mentorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={interactionType} onValueChange={setInteractionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qa">Quick Q&A / Chat</SelectItem>
                    <SelectItem value="session_1on1">1:1 Session (Video)</SelectItem>
                    <SelectItem value="relay">Career Relay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {interactionType === 'session_1on1' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-md text-sm"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time (Local)</Label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-md text-sm"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Your Message</Label>
                {/* AI Feature hidden for now
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                  onClick={generateWithAI}
                  disabled={generatingAI}
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  {generatingAI ? 'Drafting...' : 'Generate with AI'}
                </Button>
                */}
              </div>
              <Textarea 
                placeholder="Hi! I saw you work in AI at Microsoft. I'm currently building a project in..."
                className="min-h-[120px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/1000
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <Switch 
                id="anonymous" 
                checked={isAnonymous} 
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                Send anonymously
                <span className="block text-xs text-muted-foreground mt-0.5">Your name will be hidden until they accept.</span>
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
