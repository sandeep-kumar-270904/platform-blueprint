import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, CheckCircle2, Calendar, MapPin, Clock, Users, ArrowLeft, Image as ImageIcon, Check, AlertTriangle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EventCard } from "@/components/events/EventCard";

const steps = [
  { id: 1, title: "Details" },
  { id: 2, title: "Schedule" },
  { id: 3, title: "Settings" },
  { id: 4, title: "Review" }
];

const EVENT_TYPES = [
  { value: "hackathon", label: "Hackathon" },
  { value: "competition", label: "Competition" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" }
];

export default function EventCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    title: "",
    eventType: "hackathon",
    description: "",
    tags: "",
    bannerImage: "",
    
    // Schedule
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isVirtual: false,
    venue: "",
    
    // Settings
    registrationRequired: true,
    capacity: "",
    registrationDeadline: "",
    
    // Type specific
    teamSizeMin: 1,
    teamSizeMax: 4,
    prizes: "",
    agendaText: "", // Simplified agenda for now
  });

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!form.title.trim()) newErrors.title = "Event title is required";
      if (!form.description.trim()) newErrors.description = "Description is required";
    }
    
    if (step === 2) {
      if (!form.startDate) newErrors.startDate = "Start date is required";
      if (!form.endDate) newErrors.endDate = "End date is required";
      if (!form.startTime) newErrors.startTime = "Start time is required";
      if (!form.endTime) newErrors.endTime = "End time is required";
      
      if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
        newErrors.endDate = "End date cannot be before start date";
      }
      
      if (!form.isVirtual && !form.venue.trim()) {
        newErrors.venue = "Venue location is required for offline events";
      }
    }

    if (step === 3) {
      if (form.registrationRequired && !form.registrationDeadline) {
         newErrors.registrationDeadline = "Registration deadline is recommended";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) setCurrentStep(c => c + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateStep(4)) return; // Final validation pass
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Map to backend schema
      const payload: any = {
        title: form.title,
        description: form.description,
        eventType: form.eventType,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(t => t) : [],
        bannerImage: form.bannerImage || null,
        
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: form.startTime,
        endTime: form.endTime,
        timezone: form.timezone,
        
        isVirtual: form.isVirtual,
        venue: form.isVirtual ? "Virtual" : form.venue,
        
        registrationRequired: form.registrationRequired,
        capacity: form.capacity ? Number(form.capacity) : null,
        registrationDeadline: form.registrationDeadline || null,
        
        hostName: user?.full_name || user?.username || "StudentHub Host",
        draft: isDraft
      };

      if (['hackathon', 'competition'].includes(form.eventType)) {
        payload.teamSize = {
          min: Number(form.teamSizeMin) || 1,
          max: Number(form.teamSizeMax) || 1
        };
        if (form.prizes.trim()) {
          payload.prizes = form.prizes.split('\n').filter(p => p.trim());
        }
      }
      
      if (['workshop', 'seminar'].includes(form.eventType)) {
        if (form.agendaText.trim()) {
           payload.agenda = [{ time: "TBA", title: "Agenda", description: form.agendaText }];
        }
      }

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
      toast.success(isDraft ? "Draft saved successfully" : "Event published successfully!");
      navigate(`/events/${createdEvent._id || createdEvent.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  // Build a fake Event object for the live preview
  const previewEvent = {
    _id: "preview-id",
    id: "preview-id",
    title: form.title || "Event Title",
    description: form.description || "Event description will appear here.",
    eventType: form.eventType,
    bannerImage: form.bannerImage,
    startDate: form.startDate || new Date().toISOString(),
    endDate: form.endDate || new Date().toISOString(),
    startTime: form.startTime || "09:00",
    endTime: form.endTime || "17:00",
    timezone: form.timezone,
    isVirtual: form.isVirtual,
    venue: form.isVirtual ? "Virtual" : (form.venue || "Location TBA"),
    hostName: user?.full_name || user?.username || "You",
    registrationRequired: form.registrationRequired,
    capacity: form.capacity ? Number(form.capacity) : null,
    registrationCount: 0,
    tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(t=>t) : [],
    lifecycleStatus: "upcoming",
    status: "approved"
  };

  const getMissingFields = () => {
     const missing = [];
     if (!form.title) missing.push("Title");
     if (!form.description) missing.push("Description");
     if (!form.startDate || !form.endDate) missing.push("Dates");
     if (!form.startTime || !form.endTime) missing.push("Times");
     if (!form.isVirtual && !form.venue) missing.push("Venue");
     return missing;
  };
  const missingFields = getMissingFields();
  const isReady = missingFields.length === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Top Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/events")} className="text-muted-foreground -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
            </Button>
            <div className="h-6 w-px bg-border hidden md:block" />
            <h1 className="font-semibold hidden md:block">Create Event</h1>
          </div>
          
          <div className="flex flex-1 justify-center max-w-md mx-4">
            <div className="flex items-center w-full relative">
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full">
                  <div 
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  />
               </div>
               <div className="w-full flex justify-between relative z-10">
                 {steps.map(step => (
                   <div key={step.id} className="flex flex-col items-center">
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                       currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border-2 border-background'
                     }`}>
                       {currentStep > step.id ? <Check className="w-3 h-3" /> : step.id}
                     </div>
                     <span className={`text-[10px] mt-1 font-medium absolute top-6 hidden md:block ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                       {step.title}
                     </span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline-block mr-2">Drafts saved automatically</span>
            <Button variant="outline" size="sm" onClick={() => handleSubmit(true)} disabled={loading}>
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Content Area */}
          <div className={`flex-1 ${currentStep === 4 ? 'lg:order-2' : ''}`}>
             <div className="max-w-2xl mx-auto">
               
               {/* STEP 1: DETAILS */}
               {currentStep === 1 && (
                 <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Event Details</h2>
                      <p className="text-muted-foreground">Tell students what this event is about.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Event Title <span className="text-destructive">*</span></Label>
                        <Input 
                          placeholder="e.g. AI Innovation Challenge 2026" 
                          value={form.title}
                          onChange={e => {
                            setForm({...form, title: e.target.value});
                            if(errors.title) setErrors({...errors, title: ""});
                          }}
                        />
                        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Event Type <span className="text-destructive">*</span></Label>
                        <Select value={form.eventType} onValueChange={v => setForm({...form, eventType: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Description <span className="text-destructive">*</span></Label>
                        <p className="text-xs text-muted-foreground mb-2">Explain what participants will experience, learn, or build.</p>
                        <Textarea 
                          className="min-h-[160px] resize-y" 
                          placeholder="Join us for a weekend of building..." 
                          value={form.description}
                          onChange={e => {
                            setForm({...form, description: e.target.value});
                            if(errors.description) setErrors({...errors, description: ""});
                          }}
                        />
                        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Cover Image URL (Optional)</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            value={form.bannerImage}
                            onChange={e => setForm({...form, bannerImage: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tags (Optional)</Label>
                        <Input 
                          placeholder="e.g. react, ai, beginner (comma separated)" 
                          value={form.tags}
                          onChange={e => setForm({...form, tags: e.target.value})}
                        />
                      </div>
                    </div>
                 </div>
               )}

               {/* STEP 2: SCHEDULE */}
               {currentStep === 2 && (
                 <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Schedule & Location</h2>
                      <p className="text-muted-foreground">When and where will this happen?</p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date <span className="text-destructive">*</span></Label>
                          <Input 
                            type="date" 
                            value={form.startDate} 
                            onChange={e => {
                              setForm({...form, startDate: e.target.value});
                              if(errors.startDate) setErrors({...errors, startDate: ""});
                            }}
                          />
                          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Start Time <span className="text-destructive">*</span></Label>
                          <Input 
                            type="time" 
                            value={form.startTime} 
                            onChange={e => {
                              setForm({...form, startTime: e.target.value});
                              if(errors.startTime) setErrors({...errors, startTime: ""});
                            }}
                          />
                          {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>End Date <span className="text-destructive">*</span></Label>
                          <Input 
                            type="date" 
                            value={form.endDate} 
                            onChange={e => {
                              setForm({...form, endDate: e.target.value});
                              if(errors.endDate) setErrors({...errors, endDate: ""});
                            }}
                          />
                          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>End Time <span className="text-destructive">*</span></Label>
                          <Input 
                            type="time" 
                            value={form.endTime} 
                            onChange={e => {
                              setForm({...form, endTime: e.target.value});
                              if(errors.endTime) setErrors({...errors, endTime: ""});
                            }}
                          />
                          {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                         <Label>Timezone</Label>
                         <Select value={form.timezone} onValueChange={v => setForm({...form, timezone: v})}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="UTC">UTC</SelectItem>
                             <SelectItem value="America/New_York">Eastern Time (US/Canada)</SelectItem>
                             <SelectItem value="America/Los_Angeles">Pacific Time (US/Canada)</SelectItem>
                             <SelectItem value="Europe/London">London (GMT)</SelectItem>
                             <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                             {![
                               "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Kolkata"
                             ].includes(Intl.DateTimeFormat().resolvedOptions().timeZone) && (
                               <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                                 {Intl.DateTimeFormat().resolvedOptions().timeZone} (Local)
                               </SelectItem>
                             )}
                           </SelectContent>
                         </Select>
                      </div>

                      <div className="pt-6 border-t space-y-4">
                        <Label>Event Mode</Label>
                        <div className="flex gap-4">
                          <Button 
                            type="button"
                            variant={form.isVirtual ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setForm({...form, isVirtual: true, venue: ""})}
                          >
                            Online
                          </Button>
                          <Button 
                            type="button"
                            variant={!form.isVirtual ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setForm({...form, isVirtual: false})}
                          >
                            In-Person
                          </Button>
                        </div>
                      </div>

                      {!form.isVirtual && (
                        <div className="space-y-2 animate-in fade-in">
                          <Label>Venue Address <span className="text-destructive">*</span></Label>
                          <Input 
                            placeholder="e.g. University Main Auditorium" 
                            value={form.venue}
                            onChange={e => {
                              setForm({...form, venue: e.target.value});
                              if(errors.venue) setErrors({...errors, venue: ""});
                            }}
                          />
                          {errors.venue && <p className="text-xs text-destructive">{errors.venue}</p>}
                        </div>
                      )}

                    </div>
                 </div>
               )}

               {/* STEP 3: SETTINGS */}
               {currentStep === 3 && (
                 <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Participation & Settings</h2>
                      <p className="text-muted-foreground">Define who can participate and how the event works.</p>
                    </div>

                    <div className="space-y-6">
                      
                      <div className="flex items-center justify-between p-4 border rounded-xl bg-card">
                        <div className="space-y-0.5">
                          <Label className="text-base">Require Registration</Label>
                          <p className="text-xs text-muted-foreground">Students must RSVP to attend</p>
                        </div>
                        <Switch 
                          checked={form.registrationRequired} 
                          onCheckedChange={(c) => setForm({...form, registrationRequired: c})}
                        />
                      </div>

                      {form.registrationRequired && (
                        <div className="grid sm:grid-cols-2 gap-6 p-4 border rounded-xl bg-muted/30">
                          <div className="space-y-2">
                            <Label>Capacity (Optional)</Label>
                            <Input 
                              type="number" 
                              placeholder="Unlimited" 
                              value={form.capacity} 
                              onChange={e => setForm({...form, capacity: e.target.value})}
                            />
                            <p className="text-[10px] text-muted-foreground">Leave empty for unlimited</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Registration Deadline</Label>
                            <Input 
                              type="date" 
                              value={form.registrationDeadline} 
                              onChange={e => {
                                setForm({...form, registrationDeadline: e.target.value});
                                if(errors.registrationDeadline) setErrors({...errors, registrationDeadline: ""});
                              }}
                            />
                            {errors.registrationDeadline && <p className="text-xs text-warning">{errors.registrationDeadline}</p>}
                          </div>
                        </div>
                      )}

                      {/* Conditional Settings based on Event Type */}
                      {['hackathon', 'competition'].includes(form.eventType) && (
                         <div className="space-y-6 pt-6 border-t">
                           <h3 className="font-semibold text-primary flex items-center gap-2">
                             <Users className="w-4 h-4" /> Hackathon / Competition Settings
                           </h3>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Min Team Size</Label>
                                <Input type="number" min="1" value={form.teamSizeMin} onChange={e => setForm({...form, teamSizeMin: Number(e.target.value)})} />
                              </div>
                              <div className="space-y-2">
                                <Label>Max Team Size</Label>
                                <Input type="number" min="1" value={form.teamSizeMax} onChange={e => setForm({...form, teamSizeMax: Number(e.target.value)})} />
                              </div>
                           </div>

                           <div className="space-y-2">
                              <Label>Prizes (One per line)</Label>
                              <Textarea 
                                placeholder="1st Place: $500\n2nd Place: $250" 
                                value={form.prizes}
                                onChange={e => setForm({...form, prizes: e.target.value})}
                                rows={3}
                              />
                           </div>
                         </div>
                      )}

                      {['workshop', 'seminar'].includes(form.eventType) && (
                         <div className="space-y-6 pt-6 border-t">
                           <h3 className="font-semibold text-primary flex items-center gap-2">
                             <Clock className="w-4 h-4" /> Workshop / Seminar Settings
                           </h3>
                           
                           <div className="space-y-2">
                              <Label>Agenda overview</Label>
                              <Textarea 
                                placeholder="Briefly describe the schedule or topics covered..." 
                                value={form.agendaText}
                                onChange={e => setForm({...form, agendaText: e.target.value})}
                                rows={3}
                              />
                           </div>
                         </div>
                      )}

                    </div>
                 </div>
               )}

               {/* STEP 4: REVIEW */}
               {currentStep === 4 && (
                 <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Publish Checklist</h2>
                      <p className="text-muted-foreground">Review your event before it goes live.</p>
                    </div>

                    {isReady ? (
                      <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-success">Ready to publish</p>
                          <p className="text-sm text-success/80">All required information is complete. Students will be able to see and register for this event immediately.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-destructive">{missingFields.length} item(s) need attention</p>
                          <ul className="list-disc list-inside text-sm text-destructive/80 mt-1">
                            {missingFields.map(m => <li key={m}>{m} is missing</li>)}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="p-5 border rounded-xl bg-card space-y-3">
                         <div className="flex justify-between items-center">
                           <h4 className="font-semibold">Event Details</h4>
                           <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>Edit</Button>
                         </div>
                         <ul className="space-y-2 text-sm">
                           <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Title: {form.title || <span className="text-destructive">Missing</span>}</li>
                           <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Type: <span className="capitalize">{form.eventType}</span></li>
                           <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Description added</li>
                         </ul>
                      </div>

                      <div className="p-5 border rounded-xl bg-card space-y-3">
                         <div className="flex justify-between items-center">
                           <h4 className="font-semibold">Schedule & Location</h4>
                           <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>Edit</Button>
                         </div>
                         <ul className="space-y-2 text-sm">
                           <li className="flex items-center gap-2">
                             {form.startDate ? <Check className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-destructive" />} 
                             Date: {form.startDate} {form.endDate ? `to ${form.endDate}` : ''}
                           </li>
                           <li className="flex items-center gap-2">
                             {form.startTime ? <Check className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-destructive" />} 
                             Time: {form.startTime} - {form.endTime} ({form.timezone})
                           </li>
                           <li className="flex items-center gap-2">
                             {(form.isVirtual || form.venue) ? <Check className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                             Mode: {form.isVirtual ? 'Virtual' : `In-Person (${form.venue || 'Missing Venue'})`}
                           </li>
                         </ul>
                      </div>
                    </div>
                 </div>
               )}

             </div>
          </div>

          {/* Right Column / Live Preview */}
          <div className={`hidden lg:block lg:w-[400px] shrink-0 ${currentStep === 4 ? 'lg:order-1' : ''}`}>
             <div className="sticky top-24">
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Live Preview</h3>
                </div>
                <div className="opacity-90 pointer-events-none">
                  {/* We cast the fake event to any because it's a structural mock */}
                  <EventCard event={previewEvent as any} compact={false} />
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 z-40 bg-background border-t p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto max-w-2xl lg:max-w-6xl flex justify-between items-center">
           <div>
             {currentStep > 1 && (
               <Button variant="outline" onClick={handleBack}>
                 <ChevronLeft className="w-4 h-4 mr-2" /> Back
               </Button>
             )}
           </div>
           
           <div className="flex gap-3">
             {currentStep < 4 ? (
               <Button onClick={handleNext}>
                 Continue <ChevronRight className="w-4 h-4 ml-2" />
               </Button>
             ) : (
               <Button onClick={() => handleSubmit(false)} disabled={!isReady || loading} className="w-40 font-bold">
                 {loading ? "Publishing..." : "Publish Event"}
               </Button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
