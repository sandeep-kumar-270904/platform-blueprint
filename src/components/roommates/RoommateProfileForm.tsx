import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface RoommateProfileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess: () => void;
  focusField?: string;
}

export const RoommateProfileForm: React.FC<RoommateProfileFormProps> = ({ open, onOpenChange, initialData, onSuccess, focusField }) => {
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
    profilePhoto: initialData?.profilePhoto || "",
    galleryPhotos: initialData?.galleryPhotos || [],
    visibility: initialData?.visibility || "everyone",
    status: initialData?.status || "active",
    guestPolicy: initialData?.lifestyle_preferences?.guestPolicy || "",
    cookingHabits: initialData?.lifestyle_preferences?.cookingHabits || "",
    sharedSpaceExpectations: initialData?.lifestyle_preferences?.sharedSpaceExpectations || ""
  });

  React.useEffect(() => {
    if (open && focusField) {
      // Small delay to allow dialog to render
      setTimeout(() => {
        const el = document.getElementById(focusField);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a temporary highlight effect
          el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-md', 'transition-all', 'duration-1000');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-md');
          }, 2000);
        }
      }, 300);
    }
  }, [open, focusField]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) => {
    const files = e.target.files;
    if (!files) return;

    if (isGallery && formData.galleryPhotos.length + files.length > 3) {
      toast({ title: "Limit exceeded", description: "You can only upload up to 3 gallery photos.", variant: "destructive" });
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > 2 * 1024 * 1024) { // 2MB max for Base64 sanity
        toast({ title: "File too large", description: "Each image must be under 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isGallery) {
          setFormData(prev => ({ ...prev, galleryPhotos: [...prev.galleryPhotos, base64String].slice(0, 3) }));
        } else {
          setFormData(prev => ({ ...prev, profilePhoto: base64String }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryPhotos: prev.galleryPhotos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.budgetMin) >= Number(formData.budgetMax)) {
      toast({ title: "Invalid Budget", description: "Minimum budget must be less than maximum.", variant: "destructive" });
      return;
    }
    
    if (new Date(formData.moveInDate) < new Date(new Date().setHours(0,0,0,0))) {
      toast({ title: "Invalid Date", description: "Move-in date cannot be in the past.", variant: "destructive" });
      return;
    }

    if (formData.bio.length < 10 || formData.bio.length > 1000) {
      toast({ title: "Invalid Bio", description: "Bio must be between 10 and 1000 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const payload = {
        budgetRange: { min: Number(formData.budgetMin), max: Number(formData.budgetMax) },
        preferredLocations: formData.preferredLocations.split(",").map(s => s.trim()).filter(Boolean),
        moveInDate: formData.moveInDate,
        bio: formData.bio,
        profilePhoto: formData.profilePhoto,
        galleryPhotos: formData.galleryPhotos,
        lifestyle_preferences: {
          cleanliness: formData.cleanliness,
          sleepSchedule: formData.sleepSchedule,
          noiseTolerance: formData.noiseTolerance,
          smoking: formData.smoking,
          pets: formData.pets,
          guestPolicy: formData.guestPolicy,
          cookingHabits: formData.cookingHabits,
          sharedSpaceExpectations: formData.sharedSpaceExpectations
        },
        visibility: formData.visibility,
        status: formData.status
      };

      const res = await fetch(`${API_URL}/api/roommates/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save profile");
      
      toast({ title: "Success", description: "Profile saved successfully." });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save profile. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold display-font">Your Roommate Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          {/* Photos Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Photos</h3>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Photo */}
              <div id="field-profilePhoto" className="flex-shrink-0 flex flex-col items-center gap-2 p-2">
                <Label>Profile Photo</Label>
                <div 
                  className="w-32 h-32 rounded-full border-2 border-dashed border-primary/20 flex flex-col items-center justify-center bg-secondary/30 relative overflow-hidden cursor-pointer hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  aria-label="Upload profile photo"
                >
                  {formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground font-medium">Upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => handleImageUpload(e, false)} />
                </div>
                {formData.profilePhoto && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(p => ({...p, profilePhoto: ""}))} className="h-6 text-xs text-destructive">Remove</Button>
                )}
              </div>
              
              {/* Gallery Photos */}
              <div id="field-galleryPhotos" className="flex-1 space-y-2 p-2">
                <Label>Gallery (Flat/Room) - Up to 3</Label>
                <div className="flex flex-wrap gap-3">
                  {formData.galleryPhotos.map((photo, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                      <img src={photo} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryPhoto(idx)} aria-label="Remove photo" className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none focus:ring-2 focus:ring-primary">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {formData.galleryPhotos.length < 3 && (
                    <div 
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/20 flex flex-col items-center justify-center bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => galleryInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          galleryInputRef.current?.click();
                        }
                      }}
                      aria-label="Upload gallery photo"
                    >
                      <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Add Photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" multiple className="hidden" ref={galleryInputRef} onChange={(e) => handleImageUpload(e, true)} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Min Budget ($)</Label>
              <Input id="budgetMin" type="number" inputMode="numeric" required value={formData.budgetMin} onChange={e => setFormData({...formData, budgetMin: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Max Budget ($)</Label>
              <Input id="budgetMax" type="number" inputMode="numeric" required value={formData.budgetMax} onChange={e => setFormData({...formData, budgetMax: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locations">Preferred Locations (Comma separated)</Label>
              <Input id="locations" required placeholder="e.g. Downtown, North Campus" value={formData.preferredLocations} onChange={e => setFormData({...formData, preferredLocations: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="moveInDate">Move-in Date</Label>
              <Input id="moveInDate" type="date" required value={formData.moveInDate} onChange={e => setFormData({...formData, moveInDate: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div id="field-cleanliness" className="space-y-2">
              <Label htmlFor="cleanliness">Cleanliness</Label>
              <Select name="cleanliness" value={formData.cleanliness} onValueChange={v => setFormData({...formData, cleanliness: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Messy">Messy</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Clean">Clean</SelectItem>
                  <SelectItem value="Neat Freak">Neat Freak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div id="field-sleepSchedule" className="space-y-2">
              <Label htmlFor="sleepSchedule">Sleep Schedule</Label>
              <Select name="sleepSchedule" value={formData.sleepSchedule} onValueChange={v => setFormData({...formData, sleepSchedule: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Early Bird">Early Bird</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                  <SelectItem value="Night Owl">Night Owl</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div id="field-noiseTolerance" className="space-y-2">
              <Label htmlFor="noiseTolerance">Noise Tolerance</Label>
              <Select name="noiseTolerance" value={formData.noiseTolerance} onValueChange={v => setFormData({...formData, noiseTolerance: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div id="field-smoking" className="space-y-2">
              <Label htmlFor="smoking">Smoking</Label>
              <Select name="smoking" value={formData.smoking} onValueChange={v => setFormData({...formData, smoking: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Outside only">Outside only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div id="field-pets" className="space-y-2">
              <Label htmlFor="pets">Pets</Label>
              <Select name="pets" value={formData.pets} onValueChange={v => setFormData({...formData, pets: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Cats only">Cats only</SelectItem>
                  <SelectItem value="Dogs only">Dogs only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div id="field-bio" className="space-y-2 p-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" required placeholder="Tell potential roommates about yourself..." rows={4} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/1000</p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Advanced Lifestyle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="field-guestPolicy" className="space-y-2">
                <Label htmlFor="guestPolicy">Guest Policy</Label>
                <Select name="guestPolicy" value={formData.guestPolicy} onValueChange={v => setFormData({...formData, guestPolicy: v})}>
                  <SelectTrigger><SelectValue placeholder="How often do you have guests?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strictly No Guests">Strictly No Guests</SelectItem>
                    <SelectItem value="Rarely">Rarely</SelectItem>
                    <SelectItem value="Occasionally">Occasionally</SelectItem>
                    <SelectItem value="Frequently">Frequently</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div id="field-cookingHabits" className="space-y-2">
                <Label htmlFor="cookingHabits">Cooking Habits</Label>
                <Select name="cookingHabits" value={formData.cookingHabits} onValueChange={v => setFormData({...formData, cookingHabits: v})}>
                  <SelectTrigger><SelectValue placeholder="How do you handle meals?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rarely Cooks">Rarely Cooks</SelectItem>
                    <SelectItem value="Cooks Often - Keeps Separate">Cooks Often - Keeps Separate</SelectItem>
                    <SelectItem value="Cooks Often - Shares Meals">Cooks Often - Shares Meals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div id="field-sharedSpaceExpectations" className="space-y-2 md:col-span-2">
                <Label htmlFor="sharedSpaceExpectations">Shared Space Expectations</Label>
                <Select name="sharedSpaceExpectations" value={formData.sharedSpaceExpectations} onValueChange={v => setFormData({...formData, sharedSpaceExpectations: v})}>
                  <SelectTrigger><SelectValue placeholder="How do you view shared living?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strictly Separate">Strictly Separate (Groceries, chores, etc.)</SelectItem>
                    <SelectItem value="Happy to Share">Happy to Share (Groceries, common items)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Privacy & Visibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="field-visibility" className="space-y-2">
                <Label htmlFor="visibility">Profile Visibility</Label>
                <Select name="visibility" value={formData.visibility} onValueChange={v => setFormData({...formData, visibility: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Visible to everyone</SelectItem>
                    <SelectItem value="same_college">Same college only</SelectItem>
                    <SelectItem value="hidden">Hidden from discovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div id="field-status" className="space-y-2">
                <Label htmlFor="status">Profile Status</Label>
                <Select name="status" value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Matching)</SelectItem>
                    <SelectItem value="paused">Paused (Temporarily Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" className="min-h-[44px]" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="min-h-[44px]" aria-live="polite">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
