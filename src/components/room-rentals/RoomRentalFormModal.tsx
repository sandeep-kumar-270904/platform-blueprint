import React, { useState, useEffect } from "react";
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
import { useRoomRentals, RoomRental } from "@/hooks/useRoomRentals";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, X, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";

interface RoomRentalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomToEdit?: RoomRental | null;
}

const AMENITIES_LIST = [
  "WiFi", "AC", "Laundry", "Parking", "Furnished", "Balcony", "Gym", "Pool", "Elevator"
];

export const RoomRentalFormModal = ({ open, onOpenChange, roomToEdit }: RoomRentalFormModalProps) => {
  const { toast } = useToast();
  const { createRental, editListing } = useRoomRentals();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rent: "",
    roomType: "Single" as "Single" | "Shared" | "Entire Unit",
    location: "",
    availableBeds: "1",
    moveInDate: "",
    utilitiesIncluded: false,
    utilitiesNote: "",
    amenities: [] as string[],
    deposit: "0",
    minLease: "0",
    houseRules: {
      smokingAllowed: false,
      petsAllowed: false,
      guestPolicy: "Flexible",
      genderPreference: "Any",
      quietHours: ""
    },
    coverPhotoIndex: 0
  });

  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (roomToEdit && open) {
      setFormData({
        title: roomToEdit.title || "",
        description: roomToEdit.description || "",
        rent: roomToEdit.rent ? roomToEdit.rent.toString() : "",
        roomType: roomToEdit.roomType || "Single",
        location: roomToEdit.location || "",
        availableBeds: roomToEdit.availableBeds ? roomToEdit.availableBeds.toString() : "1",
        moveInDate: roomToEdit.moveInDate ? new Date(roomToEdit.moveInDate).toISOString().split('T')[0] : "",
        utilitiesIncluded: roomToEdit.utilitiesIncluded || false,
        utilitiesNote: roomToEdit.utilitiesNote || "",
        amenities: roomToEdit.amenities || [],
        deposit: roomToEdit.deposit ? roomToEdit.deposit.toString() : "0",
        minLease: roomToEdit.minLease ? roomToEdit.minLease.toString() : "0",
        houseRules: {
          smokingAllowed: roomToEdit.houseRules?.smokingAllowed || false,
          petsAllowed: roomToEdit.houseRules?.petsAllowed || false,
          guestPolicy: roomToEdit.houseRules?.guestPolicy || "Flexible",
          genderPreference: roomToEdit.houseRules?.genderPreference || "Any",
          quietHours: roomToEdit.houseRules?.quietHours || ""
        },
        coverPhotoIndex: 0
      });
      setExistingPhotos(roomToEdit.photos || []);
      setFiles([]);
      setActiveTab("basic");
    } else if (!open) {
      setFormData({
        title: "", description: "", rent: "", roomType: "Single",
        location: "", availableBeds: "1", moveInDate: "",
        utilitiesIncluded: false, utilitiesNote: "", amenities: [],
        deposit: "0", minLease: "0",
        houseRules: { smokingAllowed: false, petsAllowed: false, guestPolicy: "Flexible", genderPreference: "Any", quietHours: "" },
        coverPhotoIndex: 0
      });
      setExistingPhotos([]);
      setFiles([]);
      setActiveTab("basic");
    }
  }, [roomToEdit, open]);

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length + files.length + existingPhotos.length > 5) {
        toast({ title: "Limit Exceeded", description: "You can upload a maximum of 5 photos.", variant: "destructive" });
        return;
      }
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
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
      let uploadedUrls = [...existingPhotos];

      if (files.length > 0) {
        const uploadData = new FormData();
        files.forEach(file => uploadData.append('files', file));
        
        const uploadRes = await api.post('/uploads/multiple', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newUrls = uploadRes.data.files.map((f: any) => f.url);
        uploadedUrls = [...uploadedUrls, ...newUrls];
      }
      
      if (formData.coverPhotoIndex > 0 && formData.coverPhotoIndex < uploadedUrls.length) {
        const cover = uploadedUrls.splice(formData.coverPhotoIndex, 1)[0];
        uploadedUrls.unshift(cover);
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        rent: Number(formData.rent),
        roomType: formData.roomType,
        location: formData.location,
        availableBeds: Number(formData.availableBeds),
        moveInDate: formData.moveInDate,
        photos: uploadedUrls,
        utilitiesIncluded: formData.utilitiesIncluded,
        utilitiesNote: formData.utilitiesNote,
        amenities: formData.amenities,
        deposit: Number(formData.deposit),
        minLease: Number(formData.minLease),
        houseRules: formData.houseRules
      };

      if (roomToEdit) {
        await editListing.mutateAsync({ id: roomToEdit._id, data: payload });
        toast({ title: "Success", description: "Listing updated successfully!" });
      } else {
        await createRental.mutateAsync(payload);
        toast({ title: "Success", description: "Room listed successfully!" });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save listing.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{roomToEdit ? "Edit Room Listing" : "Post a Room Listing"}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details & Rules</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="basic" className="m-0 space-y-4">
              <div>
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Spacious room near campus" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your room..." className="h-24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rent ($/month)</Label>
                  <Input required type="number" min="0" value={formData.rent} onChange={e => setFormData({...formData, rent: e.target.value})} />
                </div>
                <div>
                  <Label>Room Type</Label>
                  <Select value={formData.roomType} onValueChange={(val: any) => setFormData({...formData, roomType: val})}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Shared">Shared</SelectItem>
                      <SelectItem value="Entire Unit">Entire Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location / Area</Label>
                  <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Northside" />
                </div>
                <div>
                  <Label>Available Beds</Label>
                  <Input required type="number" min="1" value={formData.availableBeds} onChange={e => setFormData({...formData, availableBeds: e.target.value})} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="m-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Move-in Date</Label>
                  <Input required type="date" value={formData.moveInDate} onChange={e => setFormData({...formData, moveInDate: e.target.value})} />
                </div>
                <div>
                  <Label>Minimum Lease (Months)</Label>
                  <Input type="number" min="0" value={formData.minLease} onChange={e => setFormData({...formData, minLease: e.target.value})} placeholder="e.g. 6" />
                </div>
                <div>
                  <Label>Security Deposit ($)</Label>
                  <Input type="number" min="0" value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} placeholder="e.g. 500" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer h-10">
                    <input type="checkbox" checked={formData.utilitiesIncluded} onChange={e => setFormData({...formData, utilitiesIncluded: e.target.checked})} className="rounded border-input text-primary focus:ring-primary" />
                    <span>Utilities Included</span>
                  </label>
                </div>
              </div>

              {!formData.utilitiesIncluded && (
                <div>
                  <Label>Utilities Note</Label>
                  <Input placeholder="e.g. +$50 for wifi/electric" value={formData.utilitiesNote} onChange={e => setFormData({...formData, utilitiesNote: e.target.value})} />
                </div>
              )}

              <div>
                <Label className="mb-2 block border-b pb-2">Amenities</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {AMENITIES_LIST.map(amenity => (
                    <Button key={amenity} type="button" variant={formData.amenities.includes(amenity) ? "default" : "outline"} size="sm" onClick={() => handleAmenityToggle(amenity)} className="rounded-full">
                      {amenity}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block border-b pb-2">House Rules</Label>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                    <Checkbox checked={formData.houseRules.smokingAllowed} onCheckedChange={(checked) => setFormData(p => ({...p, houseRules: {...p.houseRules, smokingAllowed: checked === true}}))} />
                    <span>Smoking Allowed</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                    <Checkbox checked={formData.houseRules.petsAllowed} onCheckedChange={(checked) => setFormData(p => ({...p, houseRules: {...p.houseRules, petsAllowed: checked === true}}))} />
                    <span>Pets Allowed</span>
                  </label>
                  <div>
                    <Label>Gender Preference</Label>
                    <Select value={formData.houseRules.genderPreference} onValueChange={(val: any) => setFormData(p => ({...p, houseRules: {...p.houseRules, genderPreference: val}}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any">Any / No Preference</SelectItem>
                        <SelectItem value="Male Only">Male Only</SelectItem>
                        <SelectItem value="Female Only">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Guest Policy</Label>
                    <Input placeholder="e.g. No overnight guests" value={formData.houseRules.guestPolicy} onChange={e => setFormData(p => ({...p, houseRules: {...p.houseRules, guestPolicy: e.target.value}}))} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="m-0 space-y-4">
              <div>
                <Label>Photos (Up to 5)</Label>
                <Input type="file" accept="image/*" multiple onChange={handleFileChange} className="mt-1 mb-4" disabled={files.length + existingPhotos.length >= 5} />
                <p className="text-sm text-muted-foreground mb-4">Select a photo to set as the cover image.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingPhotos.map((photo, index) => (
                    <div key={`existing-${index}`} className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${formData.coverPhotoIndex === index ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:opacity-80'}`} onClick={() => setFormData(p => ({...p, coverPhotoIndex: index}))}>
                      <img src={photo.startsWith('http') ? photo : `http://localhost:5000${photo}`} alt="preview" className="w-full h-full object-cover" />
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
                      <div key={i} className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${formData.coverPhotoIndex === absIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:opacity-80'}`} onClick={() => setFormData(p => ({...p, coverPhotoIndex: absIndex}))}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (roomToEdit ? "Save Changes" : "Post Listing")}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
