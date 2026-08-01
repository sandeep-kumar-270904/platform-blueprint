import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ArrowRight, ArrowLeft, Upload, CheckCircle2, Home, MapPin, DollarSign, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RoommateProfileQuizProps {
  onComplete: () => void;
  onSkipToForm: () => void;
  initialData?: any;
}

export const RoommateProfileQuiz: React.FC<RoommateProfileQuizProps> = ({ onComplete, onSkipToForm, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    budgetMin: initialData?.budgetRange?.min || "",
    budgetMax: initialData?.budgetRange?.max || "",
    preferredLocations: initialData?.preferredLocations?.join(", ") || "",
    moveInDate: initialData?.moveInDate ? new Date(initialData.moveInDate).toISOString().split('T')[0] : "",
    cleanliness: initialData?.lifestyle_preferences?.cleanliness || "Average",
    sleepSchedule: initialData?.lifestyle_preferences?.sleepSchedule || "Flexible",
    noiseTolerance: initialData?.lifestyle_preferences?.noiseTolerance || "Medium",
    smoking: initialData?.lifestyle_preferences?.smoking || "No",
    pets: initialData?.lifestyle_preferences?.pets || "No",
    bio: initialData?.bio || "",
    guestPolicy: initialData?.advanced_lifestyle?.guestPolicy || "Sometimes",
    cookingHabits: initialData?.advanced_lifestyle?.cookingHabits || "Often",
    sharedSpaceExpectations: initialData?.advanced_lifestyle?.sharedSpaceExpectations || "Split tasks evenly"
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(initialData?.profilePhoto || null);
  const [galleryPhotos, setGalleryPhotos] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialData?.galleryPhotos || []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      
      setGalleryPhotos(prev => [...prev, ...filesArray]);
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const submitProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      let uploadedProfilePhotoUrl = initialData?.profilePhoto;
      let uploadedGalleryUrls = initialData?.galleryPhotos || [];

      // Upload profile photo
      if (profilePhoto) {
        const photoFormData = new FormData();
        photoFormData.append('image', profilePhoto);
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: photoFormData
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedProfilePhotoUrl = data.imageUrl;
        }
      }

      // Upload gallery photos
      if (galleryPhotos.length > 0) {
        const newGalleryUrls = [];
        for (const file of galleryPhotos) {
          const gFormData = new FormData();
          gFormData.append('image', file);
          const gRes = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: gFormData
          });
          if (gRes.ok) {
            const data = await gRes.json();
            newGalleryUrls.push(data.imageUrl);
          }
        }
        uploadedGalleryUrls = [...uploadedGalleryUrls, ...newGalleryUrls];
      }

      // Format payload
      const payload = {
        budgetRange: {
          min: Number(formData.budgetMin) || 0,
          max: Number(formData.budgetMax) || 0
        },
        preferredLocations: formData.preferredLocations.split(',').map(s => s.trim()).filter(Boolean),
        moveInDate: formData.moveInDate ? new Date(formData.moveInDate).toISOString() : undefined,
        lifestyle_preferences: {
          cleanliness: formData.cleanliness,
          sleepSchedule: formData.sleepSchedule,
          noiseTolerance: formData.noiseTolerance,
          smoking: formData.smoking,
          pets: formData.pets
        },
        advanced_lifestyle: {
          guestPolicy: formData.guestPolicy,
          cookingHabits: formData.cookingHabits,
          sharedSpaceExpectations: formData.sharedSpaceExpectations
        },
        bio: formData.bio,
        profilePhoto: uploadedProfilePhotoUrl,
        galleryPhotos: uploadedGalleryUrls,
        status: 'active'
      };

      const res = await fetch(`${API_URL}/api/roommates/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save profile');

      toast({ title: 'Success', description: 'Your profile is ready!' });
      onComplete();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Welcome to Roommate Finder! 👋",
      desc: "Let's find you the perfect living situation. First, where do you want to live?",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Locations</Label>
            <Input 
              name="preferredLocations" 
              placeholder="e.g. North Campus, Downtown, Near Station" 
              value={formData.preferredLocations} 
              onChange={handleInputChange} 
            />
            <p className="text-xs text-muted-foreground">Separate multiple locations with commas.</p>
          </div>
          <div className="pt-6">
            <Button variant="ghost" className="text-sm underline text-muted-foreground hover:text-foreground" onClick={onSkipToForm}>
              Skip quiz and fill out the standard form instead
            </Button>
          </div>
        </div>
      )
    },
    {
      title: "What's your budget? 💰",
      desc: "Let's make sure we find matches in your price range.",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Min Monthly Rent ($)</Label>
            <Input type="number" name="budgetMin" value={formData.budgetMin} onChange={handleInputChange} placeholder="500" />
          </div>
          <div className="space-y-2">
            <Label>Max Monthly Rent ($)</Label>
            <Input type="number" name="budgetMax" value={formData.budgetMax} onChange={handleInputChange} placeholder="1200" />
          </div>
        </div>
      )
    },
    {
      title: "When are you moving? 📅",
      desc: "Timeline alignment is super important for successful roommate matches.",
      content: (
        <div className="space-y-4">
          <Label>Target Move-in Date</Label>
          <Input type="date" name="moveInDate" value={formData.moveInDate} onChange={handleInputChange} />
        </div>
      )
    },
    {
      title: "How do you handle chores? 🧹",
      desc: "Honesty is the best policy! How would you describe your cleanliness at home?",
      content: (
        <RadioGroup value={formData.cleanliness} onValueChange={(v) => handleSelectChange('cleanliness', v)} className="space-y-3">
          {["Messy", "Average", "Clean", "Neat Freak"].map(opt => (
            <div key={opt} className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${formData.cleanliness === opt ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'}`} onClick={() => handleSelectChange('cleanliness', opt)}>
              <RadioGroupItem value={opt} id={`clean-${opt}`} />
              <Label htmlFor={`clean-${opt}`} className="cursor-pointer font-medium flex-1">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      )
    },
    {
      title: "Are you an early bird or night owl? 🦉",
      desc: "Let's talk about sleep schedules and noise tolerance.",
      content: (
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Sleep Schedule</Label>
            <RadioGroup value={formData.sleepSchedule} onValueChange={(v) => handleSelectChange('sleepSchedule', v)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {["Early Bird", "Flexible", "Night Owl"].map(opt => (
                <div key={opt} className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.sleepSchedule === opt ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'}`} onClick={() => handleSelectChange('sleepSchedule', opt)}>
                  <RadioGroupItem value={opt} id={`sleep-${opt}`} className="sr-only" />
                  <span className="text-center w-full">{opt}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Noise Tolerance</Label>
            <RadioGroup value={formData.noiseTolerance} onValueChange={(v) => handleSelectChange('noiseTolerance', v)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {["Low", "Medium", "High"].map(opt => (
                <div key={opt} className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.noiseTolerance === opt ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'}`} onClick={() => handleSelectChange('noiseTolerance', opt)}>
                  <RadioGroupItem value={opt} id={`noise-${opt}`} className="sr-only" />
                  <span className="text-center w-full">{opt}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )
    },
    {
      title: "A couple quick dealbreakers... 🚬",
      desc: "Do you smoke or have any pets?",
      content: (
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Smoking</Label>
            <RadioGroup value={formData.smoking} onValueChange={(v) => handleSelectChange('smoking', v)} className="grid grid-cols-2 gap-3">
              {["Yes", "No"].map(opt => (
                <div key={opt} className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.smoking === opt ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'}`} onClick={() => handleSelectChange('smoking', opt)}>
                  <RadioGroupItem value={opt} id={`smoke-${opt}`} className="sr-only" />
                  <span className="text-center w-full">{opt}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Pets</Label>
            <RadioGroup value={formData.pets} onValueChange={(v) => handleSelectChange('pets', v)} className="grid grid-cols-2 gap-3">
              {["Yes", "No"].map(opt => (
                <div key={opt} className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.pets === opt ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'}`} onClick={() => handleSelectChange('pets', opt)}>
                  <RadioGroupItem value={opt} id={`pets-${opt}`} className="sr-only" />
                  <span className="text-center w-full">{opt}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )
    },
    {
      title: "Advanced Lifestyle 🍳",
      desc: "How do you feel about guests and cooking?",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Guest Policy</Label>
            <Select value={formData.guestPolicy} onValueChange={(v) => handleSelectChange('guestPolicy', v)}>
              <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Rarely">Rarely</SelectItem>
                <SelectItem value="Sometimes">Sometimes</SelectItem>
                <SelectItem value="Often">Often</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cooking Habits</Label>
            <Select value={formData.cookingHabits} onValueChange={(v) => handleSelectChange('cookingHabits', v)}>
              <SelectTrigger><SelectValue placeholder="Select habits" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Rarely">Rarely</SelectItem>
                <SelectItem value="Sometimes">Sometimes</SelectItem>
                <SelectItem value="Often">Often</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Shared Space Expectations</Label>
            <Input name="sharedSpaceExpectations" value={formData.sharedSpaceExpectations} onChange={handleInputChange} placeholder="e.g. Split chores evenly, keep common areas tidy" />
          </div>
        </div>
      )
    },
    {
      title: "Final Touches! 📸",
      desc: "Add a bio and some photos so potential roommates can get to know you.",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea 
              name="bio" 
              placeholder="Hi! I'm a junior studying Computer Science. I love hiking, gaming, and trying new coffee shops. Looking for a relaxed and friendly roommate..." 
              value={formData.bio} 
              onChange={handleInputChange} 
              className="h-32"
            />
          </div>
          <div className="space-y-2">
            <Label>Profile Photo (Cover)</Label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload Photo
              </Button>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
              {profilePhotoPreview && <img src={profilePhotoPreview} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Review Your Profile ✨",
      desc: "Take a look at your answers. You can go back to make changes or submit if everything looks good!",
      content: (
        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-secondary/20 p-4 rounded-lg border border-border/50">
            <div>
              <span className="text-muted-foreground block mb-1">Locations</span>
              <span className="font-medium">{formData.preferredLocations || "Open"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Budget</span>
              <span className="font-medium">${formData.budgetMin || 0} - ${formData.budgetMax || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Move-in</span>
              <span className="font-medium">{formData.moveInDate || "Not set"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Cleanliness</span>
              <span className="font-medium">{formData.cleanliness}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Schedule & Noise</span>
              <span className="font-medium">{formData.sleepSchedule}, {formData.noiseTolerance} Noise</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Smoking & Pets</span>
              <span className="font-medium">Smokes: {formData.smoking} | Pets: {formData.pets}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block mb-1">Bio</span>
              <span className="font-medium italic">{formData.bio ? `"${formData.bio}"` : "No bio provided"}</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-2xl border-border/50 bg-card overflow-hidden flex flex-col h-[600px]">
        <div className="h-2 w-full bg-secondary">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        <CardHeader className="flex-shrink-0 pt-8 pb-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Step {currentStep + 1} of {steps.length}</span>
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={prevStep} className="h-8">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <CardTitle className="text-3xl font-bold">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-base">{steps[currentStep].desc}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto py-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            {steps[currentStep].content}
          </div>
        </CardContent>

        <CardFooter className="flex-shrink-0 border-t p-6 bg-secondary/10 flex justify-end">
          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep} className="w-full sm:w-auto min-w-[120px] h-12 text-md">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={submitProfile} disabled={loading} className="w-full h-12 text-md font-bold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Save & Complete Profile
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
