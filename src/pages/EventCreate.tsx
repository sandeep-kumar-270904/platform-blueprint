import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, CheckCircle2, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const steps = [
  "Basic Details",
  "Time & Location",
  "Settings",
  "Review"
];

export default function EventCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    eventType: "workshop",
    hostName: "",
    isVirtual: false,
    venue: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    registrationRequired: true,
    capacity: "",
    registrationDeadline: "",
    tags: "",
    bannerImage: ""
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        venue: form.isVirtual ? (form.venue || "Virtual") : form.venue,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        hostName: form.hostName || user?.full_name || user?.username || "Community Member",
        capacity: form.capacity ? Number(form.capacity) : null
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create event');
      }
      
      const createdEvent = await res.json();
      toast.success("Event created successfully!");
      navigate(`/events/${createdEvent._id || createdEvent.id}/manage`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="container max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
          <div className="flex items-center justify-between relative mt-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((label, i) => (
              <div key={label} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border-2 border-background'}`}>
                  {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`absolute top-10 text-xs font-medium whitespace-nowrap ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="mt-12 shadow-sm border-muted/60">
          <CardContent className="pt-6">
            {currentStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <Label>Event Title</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Intro to React Workshop" />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Select value={form.eventType} onValueChange={v => setForm({ ...form, eventType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe what attendees can expect..." />
                </div>
                <div>
                  <Label>Tags (Comma separated)</Label>
                  <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="react, web-dev, beginner" />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Timezone</Label>
                    <Input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} placeholder="e.g. America/New_York" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="virtual" 
                    checked={form.isVirtual} 
                    onCheckedChange={(c) => setForm({ ...form, isVirtual: !!c })} 
                  />
                  <Label htmlFor="virtual" className="font-normal cursor-pointer">This is a virtual event</Label>
                </div>
                
                <div>
                  <Label>{form.isVirtual ? "Meeting Link / Platform" : "Venue Location"}</Label>
                  <Input 
                    value={form.venue} 
                    onChange={e => setForm({ ...form, venue: e.target.value })} 
                    placeholder={form.isVirtual ? "e.g. Zoom link or 'Discord'" : "e.g. Room 304, Building A"} 
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <Label>Host / Organization Name</Label>
                  <Input value={form.hostName} onChange={e => setForm({ ...form, hostName: e.target.value })} placeholder={`e.g. ${user?.full_name || 'My Organization'}`} />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="regReq" 
                    checked={form.registrationRequired} 
                    onCheckedChange={(c) => setForm({ ...form, registrationRequired: !!c })} 
                  />
                  <Label htmlFor="regReq" className="font-normal cursor-pointer">Requires Registration</Label>
                </div>

                {form.registrationRequired && (
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-background">
                    <div>
                      <Label>Capacity (Leave empty for unlimited)</Label>
                      <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 50" />
                    </div>
                    <div>
                      <Label>Registration Deadline</Label>
                      <Input type="date" value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Banner Image (URL)</Label>
                  <Input value={form.bannerImage} onChange={e => setForm({ ...form, bannerImage: e.target.value })} placeholder="https://example.com/image.png" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 text-center">
                  <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{form.title || "Untitled Event"}</h3>
                  <p className="text-muted-foreground mb-4">
                    {form.startDate ? new Date(form.startDate).toLocaleDateString() : 'No date'} at {form.startTime || 'No time'} ({form.timezone})
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-background rounded-full text-sm font-medium border">
                      {form.eventType}
                    </span>
                    <span className="px-3 py-1 bg-background rounded-full text-sm font-medium border">
                      {form.isVirtual ? 'Virtual' : 'In-Person'}
                    </span>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Please review your details carefully. Your event will be created in draft mode or sent for admin approval depending on the platform settings.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || loading}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Publishing..." : "Publish Event"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
