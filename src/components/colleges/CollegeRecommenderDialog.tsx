import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface CollegeRecommenderDialogProps {
  onSuccess: (data: any) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CollegeRecommenderDialog = ({ onSuccess, open, onOpenChange }: CollegeRecommenderDialogProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    twelfthPercent: "",
    exam: "",
    examScore: "",
    course: "",
    budget: "",
    location: "",
    priority1: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.course || !formData.budget) {
      toast.error("Please fill in at least course and budget preferences.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/colleges/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to fetch recommendations");
      
      const data = await response.json();
      
      // Fallback in case of empty response from our mock
      if (!data.reach && !data.target && !data.safe) {
         throw new Error("Invalid response format");
      }

      onSuccess({
         ...data,
         course: formData.course,
         budget: formData.budget,
      });
      onOpenChange(false);
      
      // Reset form
      setTimeout(() => setStep(1), 300);
    } catch (error) {
      console.error(error);
      toast.error("AI Recommendation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 h-10">
          <Sparkles className="h-4 w-4" />
          AI Match
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI College Recommender</DialogTitle>
          <DialogDescription>
            Tell us about your profile and preferences to get curated recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-semibold text-lg mb-4">Step 1: Academic Profile</h3>
              <div className="space-y-2">
                <Label htmlFor="twelfth">12th Percentage / CGPA</Label>
                <Input id="twelfth" placeholder="e.g. 92%" value={formData.twelfthPercent} onChange={(e) => handleChange("twelfthPercent", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entrance Exam</Label>
                  <Select value={formData.exam} onValueChange={(v) => handleChange("exam", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JEE Main">JEE Main</SelectItem>
                      <SelectItem value="JEE Advanced">JEE Advanced</SelectItem>
                      <SelectItem value="BITSAT">BITSAT</SelectItem>
                      <SelectItem value="State CET">State CET</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Score / Rank</Label>
                  <Input id="score" placeholder="e.g. 15000" value={formData.examScore} onChange={(e) => handleChange("examScore", e.target.value)} />
                </div>
              </div>
              <Button className="w-full mt-4" onClick={() => setStep(2)}>Next Step</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-semibold text-lg mb-4">Step 2: Preferences</h3>
              <div className="space-y-2">
                <Label>Desired Course</Label>
                <Select value={formData.course} onValueChange={(v) => handleChange("course", v)}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Electronics">Electronics & Communication</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    <SelectItem value="Any">Any Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Fees Budget (per year)</Label>
                <Select value={formData.budget} onValueChange={(v) => handleChange("budget", v)}>
                  <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100000">Under ₹1 Lakh</SelectItem>
                    <SelectItem value="200000">Under ₹2 Lakhs</SelectItem>
                    <SelectItem value="400000">Under ₹4 Lakhs</SelectItem>
                    <SelectItem value="800000">Under ₹8 Lakhs</SelectItem>
                    <SelectItem value="1500000">No limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Preferred Location (State/City)</Label>
                <Input id="location" placeholder="e.g. Maharashtra, Delhi, or Any" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="w-1/3" onClick={() => setStep(1)}>Back</Button>
                <Button className="w-2/3" onClick={() => setStep(3)}>Next Step</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-semibold text-lg mb-4">Step 3: Top Priority</h3>
              <div className="space-y-2">
                <Label>What matters most to you?</Label>
                <Select value={formData.priority1} onValueChange={(v) => handleChange("priority1", v)}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Placements">Placements & ROI</SelectItem>
                    <SelectItem value="Academics">Academic Reputation</SelectItem>
                    <SelectItem value="Campus Life">Campus Life & Facilities</SelectItem>
                    <SelectItem value="Affordability">Low Fees / Affordability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-muted p-4 rounded-lg mt-6">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Our AI will analyze your profile against our college database to find the best Reach, Target, and Safe options.
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="w-1/3" onClick={() => setStep(2)} disabled={loading}>Back</Button>
                <Button 
                  className="w-2/3 gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white" 
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Matches
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
