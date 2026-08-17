import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";

interface SalarySubmissionFormProps {
  alumniProfile: any;
}

export const SalarySubmissionForm = ({ alumniProfile }: SalarySubmissionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentRole: alumniProfile?.currentRole || "",
    currentCompany: alumniProfile?.currentCompany || "",
    showCompany: false,
    showName: false,
    ctcBand: "",
    yearsOfExperience: 0
  });

  const ctcBands = [
    '< 3 LPA', 
    '3-5 LPA', 
    '5-8 LPA', 
    '8-12 LPA', 
    '12-20 LPA', 
    '20-30 LPA', 
    '> 30 LPA'
  ];

  const handleSubmit = async () => {
    if (!formData.ctcBand || !formData.currentRole || formData.yearsOfExperience === null) {
      return toast.error("Please fill in CTC Band, Role, and Years of Experience.");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      const res = await fetch(`${API_URL}/api/salary/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit salary data");
      
      toast.success("Salary data submitted successfully and is pending review.");
      
      // Reset form
      setFormData({
        currentRole: alumniProfile?.currentRole || "",
        currentCompany: alumniProfile?.currentCompany || "",
        showCompany: false,
        showName: false,
        ctcBand: "",
        yearsOfExperience: 0
      });
      
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  if (!alumniProfile || alumniProfile.verificationStatus !== 'verified') {
    return null; // Don't show to non-verified alumni
  }

  if (!alumniProfile.willingness?.openToSalarySharing) {
    return (
      <Card className="mt-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            Contribute to Salary Insights
          </CardTitle>
          <CardDescription>
            Help current students understand the market value of their degree. Opt-in to Salary Sharing in your Alumni settings above to securely and anonymously submit your CTC data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Submit Salary Data
        </CardTitle>
        <CardDescription>
          Your data helps students make informed career choices. Exact figures are grouped into bands to preserve your anonymity. 
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <Input 
              value={formData.currentRole} 
              onChange={(e) => setFormData(prev => ({ ...prev, currentRole: e.target.value }))}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label>Years of Experience (Total)</Label>
            <Input 
              type="number"
              min="0"
              value={formData.yearsOfExperience} 
              onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>CTC Band (INR)</Label>
            <Select 
              value={formData.ctcBand} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, ctcBand: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select CTC Band" />
              </SelectTrigger>
              <SelectContent>
                {ctcBands.map(band => (
                  <SelectItem key={band} value={band}>{band}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Current Company (Optional)</Label>
            <Input 
              value={formData.currentCompany} 
              onChange={(e) => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
              placeholder="e.g. Google"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-company" 
              checked={formData.showCompany}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showCompany: checked as boolean }))}
            />
            <label htmlFor="show-company" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Display company name in my anonymized entry
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-name" 
              checked={formData.showName}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showName: checked as boolean }))}
            />
            <label htmlFor="show-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-amber-600 dark:text-amber-500">
              Show my name publicly alongside this entry (Opt-out of anonymity)
            </label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Anonymously
        </Button>
      </CardFooter>
    </Card>
  );
};
