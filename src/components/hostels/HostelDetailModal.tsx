import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hostel, useHostel, useRequestVerification, useReportHostel } from "@/hooks/useHostels";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOwnerReputation } from "@/hooks/useHostelReviews";
import { HostelReviews } from "./HostelReviews";
import { MapPin, Users, Phone, Mail, CheckCircle2, Bed, Loader2, ShieldCheck, Heart, ShieldAlert, Flag, Star } from "lucide-react";
import { HostelInquiryModal } from "./HostelInquiryModal";
import { useSavedHostelIds, useToggleSaveHostel } from "@/hooks/useSavedHostels";
import { EmbeddedMap } from "./EmbeddedMap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HostelDetailModalProps {
  hostel: Hostel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HostelDetailModal = ({ hostel: initialHostel, open, onOpenChange }: HostelDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: hostel, isLoading } = useHostel(open ? initialHostel?._id : undefined);
  const { data: ownerReputation } = useOwnerReputation(hostel?.ownerId);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const { data: savedHostels = [] } = useSavedHostelIds(user?._id);
  const toggleSaveMutation = useToggleSaveHostel();
  const requestVerificationMutation = useRequestVerification();
  const reportMutation = useReportHostel();

  const isSaved = hostel ? savedHostels.includes(hostel._id) : false;
  const isOwner = user && hostel && user._id === hostel.ownerId;

  if (!open || !initialHostel) return null;

  const handleContactClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to contact this hostel.",
      });
      return;
    }
    setInquiryOpen(true);
  };

  const handleSaveClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save this hostel.",
      });
      return;
    }
    if (hostel) {
      toggleSaveMutation.mutate({ userId: user._id, hostelId: hostel._id, isCurrentlySaved: isSaved });
    }
  };

  const handleRequestVerification = () => {
    if (hostel) {
      requestVerificationMutation.mutate(hostel._id);
      toast({
        title: "Request Submitted",
        description: "Your verification request is pending review by an admin.",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0">
          {isLoading || !hostel ? (
            <div className="flex items-center justify-center h-64 w-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="relative w-full h-64 bg-muted">
                {hostel.photos && hostel.photos.length > 0 ? (
                  <img 
                    src={hostel.photos[hostel.coverPhotoIndex || 0] || hostel.photos[0]} 
                    alt={hostel.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary/50">
                    <Bed className="h-16 w-16 opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  {hostel.verificationStatus === 'verified' && (
                    <Badge variant="secondary" className="bg-emerald-500/90 text-white border-none shadow-sm text-sm px-3 py-1">
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm text-sm px-3 py-1">
                    {hostel.type}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <DialogHeader className="mb-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <DialogTitle className="text-2xl font-bold mb-2 flex items-center gap-2">
                        {hostel.name}
                      </DialogTitle>
                      <div className="flex items-center text-muted-foreground text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>{hostel.address}</span>
                      </div>
                      <EmbeddedMap address={hostel.address} />
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <p className="text-2xl font-bold text-primary">₹{hostel.pricing.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">/ month onwards</p>
                        {hostel.deposit?.amount > 0 && (
                          <div className="mt-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                            + ₹{hostel.deposit.amount.toLocaleString()} Deposit
                          </div>
                        )}
                      </div>
                      
                      {ownerReputation && ownerReputation.reviewCount > 0 && (
                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                          <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                          Owner Rating: {ownerReputation.rating.toFixed(1)} ({ownerReputation.reviewCount})
                        </Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                        onClick={() => {
                          if (confirm('Report this listing?')) {
                            reportMutation.mutate(
                              { id: hostel._id, reason: 'Inappropriate or fake listing' },
                              {
                                onSuccess: () => toast({ title: "Listing Reported", description: "Our moderation team will review this listing." }),
                                onError: (err: any) => toast({ variant: 'destructive', title: err.message })
                              }
                            );
                          }
                        }}
                      >
                        <Flag className="h-4 w-4 mr-2" /> Report
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-8">
                  {isOwner && (
                    <section className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Owner Controls
                      </h4>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          As the owner of this listing, you can request verification to build trust with students.
                        </p>
                        {(!hostel.verificationStatus || hostel.verificationStatus === 'none') && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={handleRequestVerification}
                            disabled={requestVerificationMutation.isPending}
                          >
                            {requestVerificationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Request Verification
                          </Button>
                        )}
                        {hostel.verificationStatus === 'pending' && (
                          <Button variant="outline" size="sm" disabled className="bg-background">
                            <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                            Verification Pending
                          </Button>
                        )}
                        {hostel.verificationStatus === 'verified' && (
                          <Button variant="outline" size="sm" disabled className="bg-background border-emerald-500 text-emerald-500">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Verified
                          </Button>
                        )}
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="font-semibold text-lg mb-2 border-b pb-2">Description</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {hostel.description}
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-lg mb-3 border-b pb-2">Room Types</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {hostel.roomTypes.map((rt, idx) => (
                        <div key={idx} className="bg-secondary/30 p-3 rounded-lg flex justify-between items-center border border-border/50">
                          <div>
                            <p className="font-medium capitalize">{rt.type} Room</p>
                            <p className="text-xs text-muted-foreground">{rt.capacity} beds</p>
                          </div>
                          <p className="font-bold">₹{rt.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {hostel.mealPlan && (
                    <section>
                      <h4 className="font-semibold text-lg mb-3 border-b pb-2">Food & Meals</h4>
                      {hostel.mealPlan.included ? (
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-primary font-medium">
                            <CheckCircle2 className="h-5 w-5" /> Meals Included
                          </div>
                          {hostel.mealPlan.type && (
                            <p className="text-sm">
                              <span className="font-semibold text-muted-foreground">Type:</span> <span className="capitalize">{hostel.mealPlan.type}</span>
                            </p>
                          )}
                          {hostel.mealPlan.note && (
                            <p className="text-sm">
                              <span className="font-semibold text-muted-foreground">Note:</span> {hostel.mealPlan.note}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-muted/50 p-4 rounded-xl text-muted-foreground text-sm flex items-center gap-2">
                          <X className="h-5 w-5" /> No meals provided by the hostel.
                        </div>
                      )}
                    </section>
                  )}

                  {hostel.houseRules && (hostel.houseRules.curfewTime || hostel.houseRules.guestPolicy || hostel.houseRules.otherRules) && (
                    <section>
                      <h4 className="font-semibold text-lg mb-3 border-b pb-2">House Rules</h4>
                      <div className="bg-secondary/20 p-4 rounded-xl border border-border/50 space-y-3">
                        {hostel.houseRules.curfewTime && (
                          <div>
                            <p className="font-semibold text-sm">Curfew Time</p>
                            <p className="text-sm text-muted-foreground">{hostel.houseRules.curfewTime}</p>
                          </div>
                        )}
                        {hostel.houseRules.guestPolicy && (
                          <div>
                            <p className="font-semibold text-sm">Guest Policy</p>
                            <p className="text-sm text-muted-foreground">{hostel.houseRules.guestPolicy}</p>
                          </div>
                        )}
                        {hostel.houseRules.otherRules && (
                          <div>
                            <p className="font-semibold text-sm">Other Rules</p>
                            <p className="text-sm text-muted-foreground">{hostel.houseRules.otherRules}</p>
                          </div>
                        )}
                        {hostel.deposit && (hostel.deposit.lockInPeriod || hostel.deposit.refundPolicy) && (
                           <div className="pt-2 border-t border-border/50">
                             <p className="font-semibold text-sm text-amber-700">Deposit & Lock-in terms</p>
                             {hostel.deposit.lockInPeriod && (
                               <p className="text-sm text-muted-foreground">Lock-in Period: {hostel.deposit.lockInPeriod}</p>
                             )}
                             {hostel.deposit.refundPolicy && (
                               <p className="text-sm text-muted-foreground">Refund Policy: {hostel.deposit.refundPolicy}</p>
                             )}
                           </div>
                        )}
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="font-semibold text-lg mb-3 border-b pb-2">Amenities</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {hostel.amenities.map(amenity => (
                        <div key={amenity} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-secondary/20 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Availability</h4>
                      <p className="text-sm text-muted-foreground">
                        <Users className="h-4 w-4 inline mr-1" />
                        {hostel.availableBeds} beds currently available out of {hostel.totalCapacity}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant={isSaved ? "secondary" : "outline"}
                        className={`px-3 ${isSaved ? "bg-primary/10 text-primary border-primary/20" : ""}`}
                        onClick={handleSaveClick}
                        disabled={toggleSaveMutation.isPending}
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? "fill-primary" : ""}`} />
                      </Button>
                      
                      <Button onClick={handleContactClick} className="flex-1 sm:flex-none">
                        <Mail className="mr-2 h-4 w-4" /> Contact Hostel
                      </Button>
                    </div>
                  </section>

                  {user && hostel.ownerContact && !isOwner && (
                    <div className="space-y-2 text-sm text-center bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">Direct Contact Information</p>
                      <p className="text-muted-foreground flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" /> <a href={`tel:${hostel.ownerContact.phone}`} className="hover:underline text-primary">{hostel.ownerContact.phone}</a>
                      </p>
                      <p className="text-muted-foreground flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4" /> <a href={`mailto:${hostel.ownerContact.email}`} className="hover:underline text-primary">{hostel.ownerContact.email}</a>
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-6 mt-6">
                    <HostelReviews hostelId={hostel._id} />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {hostel && (
        <HostelInquiryModal 
          hostel={hostel} 
          open={inquiryOpen} 
          onOpenChange={setInquiryOpen} 
        />
      )}
    </>
  );
};
