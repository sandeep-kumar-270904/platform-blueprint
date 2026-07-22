import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Calendar, Target, Clock, Code, Briefcase } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const PlacementOnboardingWizard = ({ open, onComplete, onSkip }: { open: boolean, onComplete: (data: any) => void, onSkip: () => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [placementDate, setPlacementDate] = useState<string>("");
  const [studyYear, setStudyYear] = useState<string>("");
  const [dsaComfort, setDsaComfort] = useState<string>("");
  const [hasMockExp, setHasMockExp] = useState(false);
  const [resumeReady, setResumeReady] = useState(false);
  const [targetRoleType, setTargetRoleType] = useState<string>("");
  const [weeklyHours, setWeeklyHours] = useState<number[]>([10]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const handleNext = () => {
    setErrorMsg(null);
    setStep(s => Math.min(5, s + 1));
  };
  const handlePrev = () => {
    setErrorMsg(null);
    setStep(s => Math.max(1, s - 1));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          preferences: {
            placement_date: placementDate,
            study_year: studyYear,
            dsa_comfort: dsaComfort,
            has_mock_exp: hasMockExp,
            resume_ready: resumeReady,
            target_role_type: targetRoleType,
            weekly_hours: weeklyHours[0]
          }
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Personalized Prep Plan Generated!");
      onComplete(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-onboarding/skip`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      onSkip();
      onComplete(data);
    } catch (err) {
      toast.error("Failed to skip");
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return studyYear !== "";
    if (step === 2) return dsaComfort !== "";
    if (step === 3) return true; // Companies (optional or handled separately)
    if (step === 4) return targetRoleType !== "";
    return true;
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[600px]" hideClose>
        <DialogHeader>
          <DialogTitle>Customize Your Placement Journey</DialogTitle>
          <DialogDescription>
            Step {step} of 5. Help us generate a personalized week-by-week prep plan for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 min-h-[250px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary"/> Timeline</h3>
              <div className="space-y-2">
                <Label>When does your placement season start? (Approx)</Label>
                <Input type="month" value={placementDate} onChange={e => setPlacementDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Current Year of Study</Label>
                <Select value={studyYear} onValueChange={setStudyYear}>
                  <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="Final Year">Final Year</SelectItem>
                    <SelectItem value="Graduated">Graduated / Working</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-semibold flex items-center gap-2"><Code className="w-5 h-5 text-primary"/> Current Skill Level</h3>
              <div className="space-y-2">
                <Label>Self-Assessed DSA Comfort</Label>
                <Select value={dsaComfort} onValueChange={setDsaComfort}>
                  <SelectTrigger><SelectValue placeholder="Select Comfort Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner (Struggle with basics like Arrays/Strings)</SelectItem>
                    <SelectItem value="Intermediate">Intermediate (Comfortable with Trees, Maps, basic DP)</SelectItem>
                    <SelectItem value="Advanced">Advanced (Can solve Graphs, advanced DP independently)</SelectItem>
                    <SelectItem value="None">None (Starting from scratch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border p-3 rounded">
                <div className="space-y-0.5">
                  <Label>Mock Interview Experience</Label>
                  <p className="text-xs text-muted-foreground">Have you given mock interviews before?</p>
                </div>
                <Switch checked={hasMockExp} onCheckedChange={setHasMockExp} />
              </div>
              <div className="flex items-center justify-between border p-3 rounded">
                <div className="space-y-0.5">
                  <Label>Resume Ready</Label>
                  <p className="text-xs text-muted-foreground">Do you have a completed resume ready for ATS?</p>
                </div>
                <Switch checked={resumeReady} onCheckedChange={setResumeReady} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-primary"/> Target Companies</h3>
              <div className="p-4 bg-muted/50 rounded-lg text-center border-dashed border-2">
                <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  You can configure target companies later from your Dashboard or the Interview Prep tab.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/> Target Role Type</h3>
              <div className="space-y-2">
                <Label>What type of roles are you prioritizing?</Label>
                <Select value={targetRoleType} onValueChange={setTargetRoleType}>
                  <SelectTrigger><SelectValue placeholder="Select Role Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product">Product-based (SDE/SWE)</SelectItem>
                    <SelectItem value="Service">Service-based (TCS, Infosys, etc.)</SelectItem>
                    <SelectItem value="Startup">Startups</SelectItem>
                    <SelectItem value="Open">Open to all</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Weekly Commitment</h3>
              <div className="space-y-4">
                <Label>How many hours per week can you dedicate to prep?</Label>
                <div className="pt-4">
                  <Slider 
                    value={weeklyHours} 
                    onValueChange={setWeeklyHours} 
                    max={40} 
                    min={2} 
                    step={1} 
                  />
                </div>
                <div className="text-center font-bold text-2xl text-primary">
                  {weeklyHours[0]} hours / week
                </div>
              </div>
              
              {errorMsg && (
                <div 
                  className="bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200 p-4 rounded-md text-sm mt-4"
                  role="alert"
                  aria-live="assertive"
                >
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={loading} className="w-full sm:w-auto sm:mr-auto">
            Skip for now
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            {step > 1 && <Button variant="outline" onClick={handlePrev} disabled={loading}>Back</Button>}
            {step < 5 ? (
              <Button onClick={handleNext} disabled={!isStepValid()}>Next Step</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Plan
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
