import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StudentProfile } from '@/hooks/useMentor';

interface OnboardingFormProps {
  initialData?: StudentProfile | null;
  onSave: (data: StudentProfile) => void;
  loading?: boolean;
}

const prioritiesList = ["Placements", "Research", "Campus Life", "Fees & Affordability", "Startup Culture"];

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ initialData, onSave, loading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StudentProfile>({
    branchOfInterest: initialData?.branchOfInterest || '',
    budgetRange: initialData?.budgetRange || '',
    locationPreference: initialData?.locationPreference || '',
    priorities: initialData?.priorities || [],
    currentAcademicStanding: initialData?.currentAcademicStanding || ''
  });

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);
  
  const togglePriority = (p: string) => {
    setFormData(prev => ({
      ...prev,
      priorities: prev.priorities.includes(p) 
        ? prev.priorities.filter(item => item !== p)
        : [...prev.priorities, p]
    }));
  };

  const isStepValid = () => {
    switch(step) {
      case 1: return formData.branchOfInterest.length > 2;
      case 2: return formData.budgetRange !== '' && formData.locationPreference !== '';
      case 3: return formData.priorities.length > 0;
      case 4: return formData.currentAcademicStanding !== '';
      default: return true;
    }
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>AI Mentor Profile Setup</CardTitle>
          <CardDescription>
            Help your mentor understand you better. This context will be used to personalize advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-medium">1. What are you interested in studying?</h3>
              <Input 
                placeholder="e.g. Computer Science, Mechanical, UI/UX Design..."
                value={formData.branchOfInterest}
                onChange={e => setFormData({...formData, branchOfInterest: e.target.value})}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-medium">2. Logistics & Constraints</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Budget Range (Tuition + Hostel)</label>
                <Select 
                  value={formData.budgetRange} 
                  onValueChange={v => setFormData({...formData, budgetRange: v})}
                >
                  <SelectTrigger><SelectValue placeholder="Select a budget..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< 5 Lakhs">Under 5 Lakhs</SelectItem>
                    <SelectItem value="5-10 Lakhs">5 - 10 Lakhs</SelectItem>
                    <SelectItem value="10-20 Lakhs">10 - 20 Lakhs</SelectItem>
                    <SelectItem value="> 20 Lakhs">Above 20 Lakhs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location Preference</label>
                <Input 
                  placeholder="e.g. Maharashtra, South India, or 'Anywhere'"
                  value={formData.locationPreference}
                  onChange={e => setFormData({...formData, locationPreference: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-medium">3. What matters most to you?</h3>
              <p className="text-sm text-muted-foreground">Select your top priorities when choosing a college.</p>
              <div className="flex flex-wrap gap-2">
                {prioritiesList.map(p => (
                  <Badge 
                    key={p}
                    variant={formData.priorities.includes(p) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => togglePriority(p)}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-medium">4. Where are you currently?</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Standing / Scores</label>
                <Input 
                  placeholder="e.g. 12th Grade, 90% PCM, JEE Mains 95 percentile"
                  value={formData.currentAcademicStanding}
                  onChange={e => setFormData({...formData, currentAcademicStanding: e.target.value})}
                />
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-between border-t border-border pt-4">
          <Button variant="ghost" onClick={handlePrev} disabled={step === 1}>Back</Button>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground mr-4">Step {step} of 4</span>
            {step < 4 ? (
              <Button onClick={handleNext} disabled={!isStepValid()}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isStepValid() || loading}>
                {loading ? "Saving..." : (initialData ? "Update Profile" : "Start Mentorship")}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
