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
import { ChevronRight, ChevronLeft, CheckCircle2, Calendar, MapPin, Clock, Users, Link as LinkIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const steps = [
  { title: "Basic Details", desc: "Name and describe your event" },
  { title: "Time & Location", desc: "When and where is it?" },
  { title: "Settings", desc: "Capacity and aesthetics" },
  { title: "Review", desc: "Confirm and publish" }
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
    if (currentStep === 0) {
      if (!form.title.trim() || !form.description.trim()) {
        return toast.error("Title and description are required.");
      }
    } else if (currentStep === 1) {
      if (!form.startDate || !form.endDate || !form.startTime || !form.endTime) {
        return toast.error("All time and date fields are required.");
      }
      if (new Date(form.endDate) < new Date(form.startDate)) {
        return toast.error("End date cannot be before start date.");
      }
      if (!form.isVirtual && !form.venue.trim()) {
        return toast.error("Venue location is required for in-person events.");
      }
    }
    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleSubmit = async (isDraft = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        venue: form.isVirtual ? (form.venue || "Virtual") : form.venue,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        hostName: form.hostName || user?.full_name || user?.username || "Community Member",
        capacity: form.capacity ? Number(form.capacity) : null,
        draft: isDraft
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
      toast.success(isDraft ? "Draft saved successfully!" : "Event submitted for approval!");
      navigate(`/events/${createdEvent._id || createdEvent.id}/manage`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="bg-muted pt-24 pb-12 border-b">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" /> Let's build something great
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Create an Event</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Host a hackathon, seminar, or workshop for the community. Fill in the details below to get started.
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative mt-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
            {steps.map((step, i) => {
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;
              return (
                <div key={step.title} className="relative z-10 flex flex-col items-center group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isActive ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30' : 
                    isCompleted ? 'bg-primary text-primary-foreground' : 
                    'bg-muted text-muted-foreground border-4 border-background'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <div className={`absolute top-14 text-center w-32 -ml-11 transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`text-sm font-bold ${isActive ? 'text-primary' : ''}`}>{step.title}</div>
                    <div className="text-xs hidden md:block mt-1 opacity-70">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-muted/60 rounded-3xl overflow-hidden backdrop-blur-sm bg-card/90 mt-20 md:mt-12">
          <CardContent className="p-8 md:p-12">
            
            {/* Step 1: Basic Details */}
            {currentStep === 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Event Title</Label>
                  <Input 
                    className="h-14 text-lg rounded-xl" 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    placeholder="e.g. Intro to React Workshop" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Event Type</Label>
                  <Select value={form.eventType} onValueChange={v => setForm({ ...form, eventType: v })}>
                    <SelectTrigger className="h-14 text-md rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Description</Label>
                  <Textarea 
                    className="min-h-[160px] text-md rounded-xl resize-y" 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    placeholder="Describe what attendees can expect..." 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Tags (Comma separated)</Label>
                  <Input 
                    className="h-14 text-md rounded-xl" 
                    value={form.tags} 
                    onChange={e => setForm({ ...form, tags: e.target.value })} 
                    placeholder="react, web-dev, beginner" 
                  />
                </div>
              </div>
            )}

            {/* Step 2: Time & Location */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date</Label>
                    <Input className="h-14 rounded-xl" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> End Date</Label>
                    <Input className="h-14 rounded-xl" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Start Time</Label>
                    <Input className="h-14 rounded-xl" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> End Time</Label>
                    <Input className="h-14 rounded-xl" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-lg font-semibold">Timezone</Label>
                    <Select value={form.timezone} onValueChange={v => setForm({ ...form, timezone: v })}>
                      <SelectTrigger className="h-14 text-md rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (US/Canada)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (US/Canada)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (US/Canada)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (US/Canada)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                        <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                        <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                        <SelectItem value="Asia/Tokyo">Japan Standard Time</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney Time</SelectItem>
                        {![
                          "UTC", "America/New_York", "America/Chicago", "America/Denver", 
                          "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Kolkata", 
                          "Asia/Tokyo", "Australia/Sydney"
                        ].includes(Intl.DateTimeFormat().resolvedOptions().timeZone) && (
                          <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                            {Intl.DateTimeFormat().resolvedOptions().timeZone} (Local)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-muted">
                  <div className="flex items-center space-x-3 bg-muted/40 p-4 rounded-2xl border mb-6 transition-colors hover:bg-muted/60">
                    <Checkbox 
                      id="virtual" 
                      className="w-6 h-6 rounded-md"
                      checked={form.isVirtual} 
                      onCheckedChange={(c) => setForm({ ...form, isVirtual: !!c })} 
                    />
                    <Label htmlFor="virtual" className="text-lg font-medium cursor-pointer flex-1">This is a virtual event</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      {form.isVirtual ? <><LinkIcon className="w-4 h-4" /> Meeting Link / Platform</> : <><MapPin className="w-4 h-4" /> Venue Location</>}
                    </Label>
                    <Input 
                      className="h-14 rounded-xl"
                      value={form.venue} 
                      onChange={e => setForm({ ...form, venue: e.target.value })} 
                      placeholder={form.isVirtual ? "e.g. Zoom link or 'Discord'" : "e.g. Room 304, Building A"} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Host / Organization Name</Label>
                  <Input className="h-14 rounded-xl" value={form.hostName} onChange={e => setForm({ ...form, hostName: e.target.value })} placeholder={`e.g. ${user?.full_name || 'My Organization'}`} />
                </div>
                
                <div className="flex items-center space-x-3 bg-muted/40 p-4 rounded-2xl border transition-colors hover:bg-muted/60">
                  <Checkbox 
                    id="regReq" 
                    className="w-6 h-6 rounded-md"
                    checked={form.registrationRequired} 
                    onCheckedChange={(c) => setForm({ ...form, registrationRequired: !!c })} 
                  />
                  <Label htmlFor="regReq" className="text-lg font-medium cursor-pointer flex-1">Requires Registration</Label>
                </div>

                {form.registrationRequired && (
                  <div className="grid md:grid-cols-2 gap-8 p-6 border rounded-2xl bg-muted/20">
                    <div className="space-y-2">
                      <Label className="text-md font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Capacity (Empty for unlimited)</Label>
                      <Input className="h-12 rounded-xl" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-md font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Registration Deadline</Label>
                      <Input className="h-12 rounded-xl" type="date" value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 pt-4 border-t border-muted">
                  <Label className="text-lg font-semibold">Banner Image (URL)</Label>
                  <Input className="h-14 rounded-xl" value={form.bannerImage} onChange={e => setForm({ ...form, bannerImage: e.target.value })} placeholder="https://example.com/image.png" />
                  {form.bannerImage && (
                    <div className="mt-4 rounded-xl overflow-hidden h-40 border border-muted relative">
                      <img src={form.bannerImage} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
                  
                  <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <Calendar className="w-10 h-10 text-primary" />
                  </div>
                  
                  <h3 className="text-3xl font-extrabold mb-3">{form.title || "Untitled Event"}</h3>
                  <p className="text-lg text-muted-foreground mb-6 font-medium">
                    {form.startDate ? new Date(form.startDate).toLocaleDateString() : 'No date'} at {form.startTime || 'No time'} <span className="text-sm opacity-70">({form.timezone})</span>
                  </p>
                  
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <span className="px-4 py-2 bg-background shadow-sm rounded-full text-sm font-bold tracking-wider uppercase text-primary border">
                      {form.eventType}
                    </span>
                    <span className="px-4 py-2 bg-background shadow-sm rounded-full text-sm font-bold tracking-wider uppercase border">
                      {form.isVirtual ? 'Virtual' : 'In-Person'}
                    </span>
                    {form.registrationRequired && (
                      <span className="px-4 py-2 bg-background shadow-sm rounded-full text-sm font-bold tracking-wider uppercase border">
                        {form.capacity ? `${form.capacity} Spots` : 'Unlimited Spots'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-center p-6 bg-muted/40 rounded-2xl border border-dashed">
                  <p className="text-muted-foreground font-medium">
                    Please review your details carefully. Your event will be created in draft mode or sent for admin approval depending on the platform settings.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6 md:p-8 bg-muted/10">
            <Button variant="outline" size="lg" className="rounded-xl h-12 px-6" onClick={handleBack} disabled={currentStep === 0 || loading}>
              <ChevronLeft className="w-5 h-5 mr-2" /> Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button size="lg" className="rounded-xl h-12 px-8 shadow-md" onClick={handleNext}>
                Continue <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="secondary" size="lg" className="rounded-xl h-12 shadow-sm" onClick={() => handleSubmit(true)} disabled={loading}>
                  Save Draft
                </Button>
                <Button size="lg" className="rounded-xl h-12 px-8 shadow-md" onClick={() => handleSubmit(false)} disabled={loading}>
                  {loading ? "Publishing..." : "Submit for Approval"}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
