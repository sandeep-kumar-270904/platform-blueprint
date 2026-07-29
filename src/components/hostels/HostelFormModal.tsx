import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateHostel, useUpdateHostel, Hostel } from "@/hooks/useHostels";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, X, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface HostelFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelToEdit?: Hostel | null;
}

const AMENITIES_LIST = [
  "WiFi", "Mess/Food", "Laundry", "AC", "Non-AC", 
  "Hot Water", "Parking", "Security", "Gym", "Power Backup"
];

export const HostelFormModal = ({ open, onOpenChange, hostelToEdit }: HostelFormModalProps) => {
  const { toast } = useToast();
  const createHostel = useCreateHostel();
  const updateHostel = useUpdateHostel();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    type: "Co-ed" as "Boys" | "Girls" | "Co-ed",
    pricing: "",
    totalCapacity: "",
    availableBeds: "",
    amenities: [] as string[],
    mealPlan: {
      included: false,
      type: null as 'veg' | 'non-veg' | 'both' | null,
      note: ""
    },
    houseRules: {
      curfewTime: "",
      guestPolicy: "",
      otherRules: ""
    },
    deposit: {
      amount: "",
      refundPolicy: "",
      lockInPeriod: ""
    },
    coverPhotoIndex: 0
  });

  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState([{ type: "single", price: "", capacity: "" }]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (hostelToEdit && open) {
      setFormData({
        name: hostelToEdit.name || "",
        description: hostelToEdit.description || "",
        address: hostelToEdit.address || "",
        type: hostelToEdit.type || "Co-ed",
        pricing: hostelToEdit.pricing ? hostelToEdit.pricing.toString() : "",
        totalCapacity: hostelToEdit.totalCapacity ? hostelToEdit.totalCapacity.toString() : "",
        availableBeds: hostelToEdit.availableBeds ? hostelToEdit.availableBeds.toString() : "",
        amenities: hostelToEdit.amenities || [],
        mealPlan: {
          included: hostelToEdit.mealPlan?.included || false,
          type: hostelToEdit.mealPlan?.type || null,
          note: hostelToEdit.mealPlan?.note || ""
        },
        houseRules: {
          curfewTime: hostelToEdit.houseRules?.curfewTime || "",
          guestPolicy: hostelToEdit.houseRules?.guestPolicy || "",
          otherRules: hostelToEdit.houseRules?.otherRules || ""
        },
        deposit: {
          amount: hostelToEdit.deposit?.amount ? hostelToEdit.deposit.amount.toString() : "",
          refundPolicy: hostelToEdit.deposit?.refundPolicy || "",
          lockInPeriod: hostelToEdit.deposit?.lockInPeriod || ""
        },
        coverPhotoIndex: hostelToEdit.coverPhotoIndex || 0
      });
      setExistingPhotos(hostelToEdit.photos || []);
      setRoomTypes(hostelToEdit.roomTypes.length ? hostelToEdit.roomTypes.map(rt => ({
        type: rt.type, price: rt.price.toString(), capacity: rt.capacity.toString()
      })) : [{ type: "single", price: "", capacity: "" }]);
      setFiles([]);
      setActiveTab("basic");
    } else if (!open) {
      setFormData({
        name: "", description: "", address: "", type: "Co-ed",
        pricing: "", totalCapacity: "", availableBeds: "",
        amenities: [],
        mealPlan: { included: false, type: null, note: "" },
        houseRules: { curfewTime: "", guestPolicy: "", otherRules: "" },
        deposit: { amount: "", refundPolicy: "", lockInPeriod: "" },
        coverPhotoIndex: 0
      });
      setExistingPhotos([]);
      setRoomTypes([{ type: "single", price: "", capacity: "" }]);
      setFiles([]);
      setActiveTab("basic");
    }
  }, [hostelToEdit, open]);

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleAddRoomType = () => {
    setRoomTypes([...roomTypes, { type: "shared", price: "", capacity: "" }]);
  };

  const handleRemoveRoomType = (index: number) => {
    setRoomTypes(roomTypes.filter((_, i) => i !== index));
  };

  const handleRoomTypeChange = (index: number, field: string, value: string) => {
    const updated = [...roomTypes];
    updated[index] = { ...updated[index], [field]: value };
    setRoomTypes(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length + files.length + existingPhotos.length > 5) {
        toast({
          title: "Limit Exceeded",
          description: "You can upload a maximum of 5 photos.",
          variant: "destructive"
        });
        return;
      }
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    // Check if cover photo index needs adjustment
    const totalPhotos = existingPhotos.length + files.length - 1;
    if (formData.coverPhotoIndex > totalPhotos - 1) {
      setFormData(prev => ({ ...prev, coverPhotoIndex: Math.max(0, totalPhotos - 1) }));
    }
  };

  const removeExistingFile = (index: number) => {
    setExistingPhotos(existingPhotos.filter((_, i) => i !== index));
    const totalPhotos = existingPhotos.length - 1 + files.length;
    if (formData.coverPhotoIndex > totalPhotos - 1) {
      setFormData(prev => ({ ...prev, coverPhotoIndex: Math.max(0, totalPhotos - 1) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('address', formData.address);
      fd.append('type', formData.type);
      fd.append('pricing', formData.pricing);
      fd.append('totalCapacity', formData.totalCapacity);
      fd.append('availableBeds', formData.availableBeds);
      fd.append('coverPhotoIndex', formData.coverPhotoIndex.toString());
      
      const parsedRoomTypes = roomTypes.map(rt => ({
        type: rt.type as "single" | "shared" | "dorm",
        price: Number(rt.price),
        capacity: Number(rt.capacity)
      }));
      fd.append('roomTypes', JSON.stringify(parsedRoomTypes));
      fd.append('amenities', JSON.stringify(formData.amenities));
      
      const parsedDeposit = {
        amount: Number(formData.deposit.amount),
        refundPolicy: formData.deposit.refundPolicy,
        lockInPeriod: formData.deposit.lockInPeriod
      };
      fd.append('deposit', JSON.stringify(parsedDeposit));
      fd.append('mealPlan', JSON.stringify(formData.mealPlan));
      fd.append('houseRules', JSON.stringify(formData.houseRules));
      
      if (hostelToEdit) {
        fd.append('existingPhotos', JSON.stringify(existingPhotos));
      }

      files.forEach(file => {
        fd.append('photos', file);
      });

      if (hostelToEdit) {
        await updateHostel.mutateAsync({ id: hostelToEdit._id, formData: fd });
      } else {
        await createHostel.mutateAsync(fd);
      }
      
      toast({
        title: "Success",
        description: hostelToEdit ? "Listing updated successfully!" : "Hostel listed successfully!",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{hostelToEdit ? "Edit Hostel Listing" : "List a New Hostel"}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="rules">Rules & Meals</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="basic" className="m-0 space-y-4">
              <div>
                <Label>Hostel Name</Label>
                <Input 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Sunrise Student Residency"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea 
                  required 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your hostel..."
                  className="h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hostel Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val: any) => setFormData({...formData, type: val})}
                  >
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boys">Boys</SelectItem>
                      <SelectItem value="Girls">Girls</SelectItem>
                      <SelectItem value="Co-ed">Co-ed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Address / Area Near Campus</Label>
                  <Input 
                    required 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="e.g. 2nd Cross, Near Tech Park"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Capacity (Beds)</Label>
                  <Input 
                    required 
                    type="number"
                    min="1"
                    value={formData.totalCapacity}
                    onChange={e => setFormData({...formData, totalCapacity: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Available Beds</Label>
                  <Input 
                    required 
                    type="number"
                    min="0"
                    value={formData.availableBeds}
                    onChange={e => setFormData({...formData, availableBeds: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <Label>Room Types & Pricing</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddRoomType}>
                    <Plus className="h-4 w-4 mr-1" /> Add Room
                  </Button>
                </div>
                {roomTypes.map((rt, index) => (
                  <div key={index} className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
                    <Select 
                      value={rt.type} 
                      onValueChange={(val) => handleRoomTypeChange(index, 'type', val)}
                    >
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                        <SelectItem value="dorm">Dorm</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input required type="number" placeholder="Price ₹" value={rt.price} onChange={e => handleRoomTypeChange(index, 'price', e.target.value)} />
                    <Input required type="number" placeholder="Beds" value={rt.capacity} onChange={e => handleRoomTypeChange(index, 'capacity', e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRoomType(index)} disabled={roomTypes.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="pt-2">
                  <Label>Starting Price (Displayed on Card)</Label>
                  <Input required type="number" min="0" value={formData.pricing} onChange={e => setFormData({...formData, pricing: e.target.value})} placeholder="e.g. 5000" />
                </div>
              </div>

              <div className="pt-2">
                <Label className="mb-2 block border-b pb-2">Amenities</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {AMENITIES_LIST.map(amenity => (
                    <Button
                      key={amenity} type="button" variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                      size="sm" onClick={() => handleAmenityToggle(amenity)} className="rounded-full"
                    >
                      {amenity}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rules" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">Meal Plan</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="mealsIncluded" 
                    checked={formData.mealPlan.included}
                    onCheckedChange={(checked) => setFormData(p => ({...p, mealPlan: {...p.mealPlan, included: checked === true}}))}
                  />
                  <Label htmlFor="mealsIncluded" className="font-medium cursor-pointer">Meals Included</Label>
                </div>
                {formData.mealPlan.included && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label>Meal Type</Label>
                      <Select 
                        value={formData.mealPlan.type || undefined} 
                        onValueChange={(val: any) => setFormData(p => ({...p, mealPlan: {...p.mealPlan, type: val}}))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veg">Vegetarian</SelectItem>
                          <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Note (e.g. Timing)</Label>
                      <Input value={formData.mealPlan.note} onChange={e => setFormData(p => ({...p, mealPlan: {...p.mealPlan, note: e.target.value}}))} placeholder="e.g. Breakfast 8AM, Dinner 8PM" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">House Rules</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Curfew Time</Label>
                    <Input value={formData.houseRules.curfewTime} onChange={e => setFormData(p => ({...p, houseRules: {...p.houseRules, curfewTime: e.target.value}}))} placeholder="e.g. 10:30 PM" />
                  </div>
                  <div>
                    <Label>Guest Policy</Label>
                    <Input value={formData.houseRules.guestPolicy} onChange={e => setFormData(p => ({...p, houseRules: {...p.houseRules, guestPolicy: e.target.value}}))} placeholder="e.g. No guests after 8 PM" />
                  </div>
                </div>
                <div>
                  <Label>Other Rules</Label>
                  <Input value={formData.houseRules.otherRules} onChange={e => setFormData(p => ({...p, houseRules: {...p.houseRules, otherRules: e.target.value}}))} placeholder="e.g. No loud music, No smoking" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">Security Deposit</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Amount (₹)</Label>
                    <Input type="number" value={formData.deposit.amount} onChange={e => setFormData(p => ({...p, deposit: {...p.deposit, amount: e.target.value}}))} placeholder="e.g. 10000" />
                  </div>
                  <div>
                    <Label>Lock-in Period</Label>
                    <Input value={formData.deposit.lockInPeriod} onChange={e => setFormData(p => ({...p, deposit: {...p.deposit, lockInPeriod: e.target.value}}))} placeholder="e.g. 6 months" />
                  </div>
                  <div>
                    <Label>Refund Policy</Label>
                    <Input value={formData.deposit.refundPolicy} onChange={e => setFormData(p => ({...p, deposit: {...p.deposit, refundPolicy: e.target.value}}))} placeholder="e.g. Fully refundable" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="m-0 space-y-4">
              <div>
                <Label>Photos (Up to 5)</Label>
                <Input 
                  type="file" accept="image/*" multiple 
                  onChange={handleFileChange} className="mt-1 mb-4"
                  disabled={files.length + existingPhotos.length >= 5}
                />
                
                <p className="text-sm text-muted-foreground mb-4">
                  Select a photo to set as the cover image.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingPhotos.map((photo, index) => (
                    <div 
                      key={`existing-${index}`} 
                      className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${formData.coverPhotoIndex === index ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:opacity-80'}`}
                      onClick={() => setFormData(p => ({...p, coverPhotoIndex: index}))}
                    >
                      <img src={`http://localhost:5000${photo}`} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingFile(index); }} className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                      {formData.coverPhotoIndex === index && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Cover
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {files.map((file, i) => {
                    const absIndex = existingPhotos.length + i;
                    return (
                      <div 
                        key={i} 
                        className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${formData.coverPhotoIndex === absIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:opacity-80'}`}
                        onClick={() => setFormData(p => ({...p, coverPhotoIndex: absIndex}))}
                      >
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {formData.coverPhotoIndex === absIndex && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" /> Cover
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-3 bg-muted/20">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                hostelToEdit ? "Save Changes" : "Create Listing"
              )}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
