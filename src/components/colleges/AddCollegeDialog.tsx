import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface AddCollegeDialogProps {
  onSuccess: () => void;
}

export const AddCollegeDialog = ({ onSuccess }: AddCollegeDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    location: { city: "", state: "" },
    type: "Private",
    logoOrIcon: "🏛️",
    website: "",
    establishedYear: "",
    officialEmailDomain: "",
    fees: { tuition: "", hostel: "" },
    avgPackage: "",
    highestPackage: "",
    placementPercentage: "",
    accreditation: "",
    admissionProcess: "",
    draft: false
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (imageFiles.length + filesArray.length > 4) {
        toast.error("You can only upload up to 4 images.");
        return;
      }
      setImageFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to add a college");
      return;
    }
    
    if (!formData.fees.tuition || !formData.fees.hostel) {
       toast.error("Tuition and Hostel fees are required");
       return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let uploadedImageUrls: string[] = [];

      // 1. Upload Images
      if (imageFiles.length > 0) {
        const uploadData = new FormData();
        imageFiles.forEach(file => uploadData.append("files", file));
        
        const uploadRes = await fetch(`${API_URL}/api/uploads/multiple`, {
          method: "POST",
          body: uploadData
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.message || "Failed to upload images");
        uploadedImageUrls = uploadJson.files.map((f: any) => f.url);
      }

      // 2. Submit College
      const payload = {
         ...formData,
         images: uploadedImageUrls,
         establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
         placementPercentage: formData.placementPercentage ? Number(formData.placementPercentage) : undefined,
         fees: {
           tuition: Number(formData.fees.tuition),
           hostel: Number(formData.fees.hostel)
         }
      };

      const res = await fetch(`${API_URL}/api/colleges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add college");
      
      toast.success(user?.role === "admin" ? "College published successfully!" : "College submitted for review!");
      
      // Reset form
      setFormData({
        name: "", location: { city: "", state: "" }, type: "Private", logoOrIcon: "🏛️",
        website: "", establishedYear: "", officialEmailDomain: "", fees: { tuition: "", hostel: "" },
        avgPackage: "", highestPackage: "", placementPercentage: "", accreditation: "", admissionProcess: "", draft: false
      });
      setImageFiles([]);
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Add College</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add a New College</DialogTitle>
          <DialogDescription className="sr-only">Add a new college to the system</DialogDescription>
        </DialogHeader>
        
        {!user ? (
          <div className="text-center py-6">
            <p className="mb-4 text-muted-foreground">You must be logged in to add a college.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col pt-4">
            {user.role !== "admin" ? (
              <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground border border-border mb-4 shrink-0">
                <strong>Note:</strong> Your college submission will be reviewed by an admin before becoming public.
              </div>
            ) : (
              <div className="bg-primary/10 p-3 rounded-md text-sm text-primary border border-primary/20 mb-4 shrink-0">
                <strong>Admin Mode:</strong> This college will be published immediately.
              </div>
            )}
            
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full grid grid-cols-4 shrink-0">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="fees">Fees & Details</TabsTrigger>
                <TabsTrigger value="placements">Placements</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto mt-4 px-1 pb-4">
                <TabsContent value="basic" className="space-y-4 m-0">
                  <div className="space-y-2">
                    <Label htmlFor="college-name">College Name *</Label>
                    <Input id="college-name" required placeholder="e.g. IIT Delhi" 
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" required placeholder="e.g. New Delhi" 
                        value={formData.location.city} onChange={(e) => setFormData({...formData, location: {...formData.location, city: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" required placeholder="e.g. Delhi" 
                        value={formData.location.state} onChange={(e) => setFormData({...formData, location: {...formData.location, state: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution-type">Institution Type *</Label>
                    <select 
                      id="institution-type" 
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="IIT">IIT</option>
                      <option value="NIT">NIT</option>
                      <option value="Private">Private</option>
                      <option value="State">State/Central</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accreditation">Accreditation</Label>
                    <Input id="accreditation" placeholder="e.g. NAAC A++, NBA" 
                      value={formData.accreditation} onChange={(e) => setFormData({...formData, accreditation: e.target.value})}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="fees" className="space-y-4 m-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tuition">Tuition Fee (₹/yr) *</Label>
                      <Input id="tuition" type="number" required placeholder="e.g. 200000" 
                        value={formData.fees.tuition} onChange={(e) => setFormData({...formData, fees: {...formData.fees, tuition: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hostel">Hostel Fee (₹/yr) *</Label>
                      <Input id="hostel" type="number" required placeholder="e.g. 50000" 
                        value={formData.fees.hostel} onChange={(e) => setFormData({...formData, fees: {...formData.fees, hostel: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="established">Established Year</Label>
                      <Input id="established" type="number" placeholder="e.g. 1961" 
                        value={formData.establishedYear} onChange={(e) => setFormData({...formData, establishedYear: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailDomain">Official Email Domain</Label>
                      <Input id="emailDomain" placeholder="e.g. iitd.ac.in" 
                        value={formData.officialEmailDomain} onChange={(e) => setFormData({...formData, officialEmailDomain: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Official Website</Label>
                    <Input id="website" placeholder="e.g. https://home.iitd.ac.in" 
                      value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="placements" className="space-y-4 m-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="avgPackage">Avg Package</Label>
                      <Input id="avgPackage" placeholder="e.g. 15 LPA" 
                        value={formData.avgPackage} onChange={(e) => setFormData({...formData, avgPackage: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="highestPackage">Highest Package</Label>
                      <Input id="highestPackage" placeholder="e.g. 1.2 CPA" 
                        value={formData.highestPackage} onChange={(e) => setFormData({...formData, highestPackage: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placementPercentage">Placement Percentage (%)</Label>
                    <Input id="placementPercentage" type="number" placeholder="e.g. 95" 
                      value={formData.placementPercentage} onChange={(e) => setFormData({...formData, placementPercentage: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admissionProcess">Admission Process</Label>
                    <Textarea id="admissionProcess" placeholder="Briefly describe the admission exams and process..." rows={3}
                      value={formData.admissionProcess} onChange={(e) => setFormData({...formData, admissionProcess: e.target.value})}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 m-0">
                  <div className="space-y-2">
                    <Label>Upload College Images (Max 4)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20">
                      <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4 text-center">Drag & drop or click to upload campus photos.</p>
                      <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                        Select Files
                      </Button>
                      <input 
                        type="file" 
                        id="image-upload" 
                        multiple 
                        accept="image/jpeg,image/png,image/webp" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </div>
                  </div>
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="relative bg-muted rounded-md p-2 flex items-center justify-between">
                          <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeFile(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-end pt-4 border-t border-border mt-2 shrink-0">
              <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save College"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
