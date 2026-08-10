import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useColleges } from "@/hooks/useColleges";
import { SalarySubmissionForm } from "./SalarySubmissionForm";

export const AlumniOptInForm = () => {
  const { user } = useAuth();
  const { colleges } = useColleges();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    collegeId: "",
    branch: user?.degree || "",
    graduationYear: user?.graduation_year || "",
    currentRole: "",
    currentCompany: "",
    visibility: "students-only",
    willingness: {
      openToQa: false,
      openToMentoring: false,
      openToSalarySharing: false,
      openToResumeReview: false,
      openToMockInterviews: false,
      openToReferrals: false
    },
    availabilityNote: ""
  });

  const [existingProfile, setExistingProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/alumni/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setExistingProfile(data);
          setFormData({
            collegeId: data.collegeId?._id || data.collegeId || "",
            branch: data.branch || "",
            graduationYear: data.graduationYear || "",
            currentRole: data.currentRole || "",
            currentCompany: data.currentCompany || "",
            visibility: data.visibility || "students-only",
            willingness: {
              openToQa: data.willingness?.openToQa || false,
              openToMentoring: data.willingness?.openToMentoring || false,
              openToSalarySharing: data.willingness?.openToSalarySharing || false,
              openToResumeReview: data.willingness?.openToResumeReview || false,
              openToMockInterviews: data.willingness?.openToMockInterviews || false,
              openToReferrals: data.willingness?.openToReferrals || false,
            },
            availabilityNote: data.availabilityNote || ""
          });
        }
      } catch (err) {
        console.error("Error fetching alumni profile", err);
      } finally {
        setFetching(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!formData.collegeId || !formData.branch || !formData.graduationYear) {
      return toast.error("Please fill in College, Branch, and Graduation Year.");
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      const res = await fetch(`${API_URL}/api/alumni/register`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Failed to register as alumni");
      const data = await res.json();
      setExistingProfile(data);
      toast.success("Alumni profile updated successfully!");
    } catch (err) {
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Alumni Network Opt-In</CardTitle>
        <CardDescription>
          Graduated? Join your college's alumni directory to mentor juniors and stay connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {existingProfile?.verificationStatus === 'pending' && (
          <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 p-3 rounded-md text-sm mb-4">
            Your alumni status is currently pending verification by an administrator.
          </div>
        )}
        {existingProfile?.verificationStatus === 'verified' && (
          <div className="bg-green-500/10 text-green-700 dark:text-green-500 p-3 rounded-md text-sm mb-4">
            Your alumni status is verified!
          </div>
        )}
        {existingProfile?.verificationStatus === 'rejected' && (
          <div className="bg-red-500/10 text-red-700 dark:text-red-500 p-3 rounded-md text-sm mb-4">
            Your alumni status request was rejected. Reason: {existingProfile.rejectionReason}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>College</Label>
            <Select 
              value={formData.collegeId} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, collegeId: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your college" />
              </SelectTrigger>
              <SelectContent>
                {colleges?.map(c => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Input 
              value={formData.branch} 
              onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))}
              placeholder="e.g. Computer Science"
            />
          </div>
          <div className="space-y-2">
            <Label>Graduation Year</Label>
            <Input 
              type="number"
              value={formData.graduationYear} 
              onChange={e => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
              placeholder="e.g. 2023"
            />
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select 
              value={formData.visibility} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, visibility: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public (Visible to everyone)</SelectItem>
                <SelectItem value="students-only">Students Only (Visible to logged in users)</SelectItem>
                <SelectItem value="private">Private (Anonymous/Hidden details)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <Input 
              value={formData.currentRole} 
              onChange={e => setFormData(prev => ({ ...prev, currentRole: e.target.value }))}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label>Current Company</Label>
            <Input 
              value={formData.currentCompany} 
              onChange={e => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
              placeholder="e.g. Google"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Willingness to Help</Label>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="qa" 
              checked={formData.willingness.openToQa}
              onCheckedChange={c => setFormData(p => ({ ...p, willingness: { ...p.willingness, openToQa: !!c }}))}
            />
            <Label htmlFor="qa" className="font-normal">Open to answering student Q&A</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="mentor" 
              checked={formData.willingness.openToMentoring}
              onCheckedChange={c => setFormData(p => ({ ...p, willingness: { ...p.willingness, openToMentoring: !!c }}))}
            />
            <Label htmlFor="mentor" className="font-normal">Open to 1:1 mentoring sessions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="salary" 
              checked={formData.willingness.openToSalarySharing}
              onCheckedChange={c => setFormData(p => ({ ...p, willingness: { ...p.willingness, openToSalarySharing: !!c }}))}
            />
            <Label htmlFor="salary" className="font-normal">Open to sharing salary data anonymously (for verified insights)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="resume" 
              checked={formData.willingness.openToResumeReview}
              onCheckedChange={c => setFormData(p => ({ ...p, willingness: { ...p.willingness, openToResumeReview: !!c }}))}
            />
            <Label htmlFor="resume" className="font-normal">Open to reviewing student resumes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="mock" 
              checked={formData.willingness.openToMockInterviews}
              onCheckedChange={c => setFormData(p => ({ ...p, willingness: { ...p.willingness, openToMockInterviews: !!c }}))}
            />
            <Label htmlFor="mock" className="font-normal">Open to conducting mock interviews</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="referral" 
              checked={formData.willingness.openToReferrals}
              onCheckedChange={c => setFormData(p => ({ ...p, willingness: { ...p.willingness, openToReferrals: !!c }}))}
            />
            <Label htmlFor="referral" className="font-normal">Open to providing job referrals</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Availability Note</Label>
          <Textarea 
            value={formData.availabilityNote}
            onChange={e => setFormData(prev => ({ ...prev, availabilityNote: e.target.value }))}
            placeholder="e.g. I can reply on weekends only."
            rows={2}
          />
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingProfile ? "Update Alumni Profile" : "Join Alumni Network"}
        </Button>
      </CardContent>
    </Card>
    <SalarySubmissionForm alumniProfile={existingProfile} />
    </>
  );
};
