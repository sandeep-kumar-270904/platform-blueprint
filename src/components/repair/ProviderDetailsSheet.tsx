import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { ServiceListing } from "@/types/repair";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Share2, Star, CheckCircle, ExternalLink, ShieldCheck, Sparkles, Flag, AlertTriangle, Heart, XCircle, Zap, ImageIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProviderReviews } from "./ProviderReviews";
import { RequestServiceModal } from "./RequestServiceModal";
import { useTranslation } from "react-i18next";

interface ProviderDetailsSheetProps {
  providerId: string | null;
  onClose: () => void;
}

export function ProviderDetailsSheet({ providerId, onClose }: ProviderDetailsSheetProps) {
  const { t, i18n } = useTranslation();
  const [provider, setProvider] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [nextSlot, setNextSlot] = useState<{date: string, time: string} | null>(null);

  const getPairedImage = (currentIdx: number) => {
    if (!provider?.gallery || lightboxIndex === null) return null;
    const current = provider.gallery[currentIdx];
    if (current.type === 'single' || !current.groupId) return null;
    
    // Find the other image in the pair
    return provider.gallery.find(img => img.groupId === current.groupId && img._id !== current._id);
  };

  useEffect(() => {
    if (!providerId) {
      setProvider(null);
      return;
    }

    const fetchProvider = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`${API_URL}/api/repair/${providerId}?locale=${i18n.language}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch provider");
        const data = await res.json();
        setProvider(data.data);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not load provider details.", variant: "destructive" });
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId, onClose]);

  useEffect(() => {
    if (!provider || !provider.schedulingConfig?.slotDurationMinutes) {
      setNextSlot(null);
      return;
    }
    const fetchNextSlot = async () => {
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const startStr = today.toISOString().split('T')[0];
        const endStr = tomorrow.toISOString().split('T')[0];
        
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/providers/${provider.id}/slots?startDate=${startStr}&endDate=${endStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data.slotsEnabled && data.data.slots.length > 0) {
            setNextSlot(data.data.slots[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch next slot", err);
      }
    };
    fetchNextSlot();
  }, [provider]);

  const handleShare = () => {
    if (!provider) return;
    const url = `${window.location.origin}/repair?provider=${provider.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied!", description: "Share link copied to clipboard." });
    });
  };

  const handleToggleSave = async () => {
    if (!provider) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "Sign in required", description: "You must be signed in to save providers.", variant: "destructive" });
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/repair/${provider.id}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProvider({ ...provider, isSaved: data.isSaved });
        toast({ title: data.isSaved ? "Saved!" : "Removed", description: data.message });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not save provider.", variant: "destructive" });
    }
  };

  const handleReport = async () => {
    const reason = prompt("Why are you reporting this provider?\n(e.g., Fraudulent listing, Incorrect info, Inappropriate behavior)");
    if (!reason || !reason.trim()) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: "Authentication required", description: "You must be logged in to report a provider.", variant: "destructive" });
        return;
      }

      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: "repair_provider",
          targetId: provider?.id,
          reason: reason.trim()
        })
      });

      if (res.ok) {
        toast({ title: "Report Submitted", description: "Thank you. Our moderation team will review this provider." });
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.message || "Could not submit report.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "A network error occurred while reporting.", variant: "destructive" });
    }
  };

  const getAvailabilityInfo = (status?: string) => {
    if (status === "Open now" || status === "Available 24/7") {
      return {
        className: "text-green-500 bg-green-500/10 border-green-500/20",
        icon: <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
      };
    }
    if (status === "Closed") {
      return {
        className: "text-red-500 bg-red-500/10 border-red-500/20",
        icon: <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
      };
    }
    return {
      className: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      icon: <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
    };
  };

  return (
    <Sheet open={!!providerId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto bg-gray-950 border-l-gray-800 p-0 sm:p-6">
        {loading || !provider ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading details...</div>
        ) : (
          <div className="flex flex-col space-y-6 pb-24 p-6 sm:p-0">
            {/* Header Section */}
            <SheetHeader className="text-left space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 uppercase tracking-wider text-[10px] text-blue-400 border-blue-400/30">
                    {provider.category}
                  </Badge>
                  <SheetTitle className="text-2xl font-bold text-white flex items-center flex-wrap gap-2">
                    {provider.name}
                    {provider.verification?.isVerified && (
                      <Badge variant="outline" className="text-[10px] uppercase text-green-500 border-green-500/30 bg-green-500/10 h-6">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {provider.rating >= 4.5 && provider.reviewsCount >= 10 && (
                      <Badge variant="outline" className="text-[10px] uppercase text-orange-500 border-orange-500/30 bg-orange-500/10 h-6">
                        Top Rated
                      </Badge>
                    )}
                    {provider.handlesEmergencies && (
                      <Badge variant="outline" className="text-[10px] uppercase text-red-500 border-red-500/30 bg-red-500/10 h-6">
                        <Zap className="w-3 h-3 mr-1" /> Handles Emergencies
                      </Badge>
                    )}
                    {provider.isRegularCustomer && (
                      <Badge variant="outline" className="text-[10px] uppercase text-purple-400 border-purple-400/30 bg-purple-400/10 h-6">
                        <Heart className="w-3 h-3 mr-1 fill-current" /> Regular Customer
                      </Badge>
                    )}
                  </SheetTitle>
                  <div className="flex items-center space-x-3 mt-2 text-sm">
                    {provider.reviewsCount === 0 ? (
                      <div className="flex items-center text-muted-foreground" aria-label="New provider, no reviews yet">
                        <Sparkles className="w-4 h-4 mr-1" aria-hidden="true" />
                        <span>New</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-400" aria-label={`${provider.rating.toFixed(1)} stars out of 5 based on ${provider.reviewsCount} reviews`}>
                        <Star className="w-4 h-4 fill-current mr-1" aria-hidden="true" />
                        <span className="font-medium text-white" aria-hidden="true">{provider.rating.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1" aria-hidden="true">
                          ({provider.reviewsCount}) • {provider.completedJobsCount || 0} Jobs
                        </span>
                      </div>
                    )}
                    <span className="text-gray-600" aria-hidden="true">•</span>
                    <Badge variant="outline" className={getAvailabilityInfo(provider.availability).className}>
                      {getAvailabilityInfo(provider.availability).icon}
                      {provider.availability || "Status unknown"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleToggleSave} aria-label={provider.isSaved ? "Remove from saved providers" : "Save provider"} className={`rounded-full min-h-[44px] min-w-[44px] ${provider.isSaved ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10' : 'text-gray-400 hover:text-white'}`}>
                    <Heart className={`w-6 h-6 ${provider.isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share provider" className="text-gray-400 hover:text-white shrink-0 min-h-[44px] min-w-[44px]">
                    <Share2 className="w-6 h-6" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <SheetDescription className="text-gray-300 text-base leading-relaxed">
                {provider.description}
                {provider.isFallbackLocale && (
                  <Badge variant="secondary" className="ml-2 text-[10px] opacity-70">
                    Original
                  </Badge>
                )}
              </SheetDescription>
            </SheetHeader>

            {/* Specialties & Services */}
            {provider.services && provider.services.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((service, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-gray-800 text-gray-200">
                      <CheckCircle className="w-3 h-3 mr-1 text-blue-400" />
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Verification & Reputation Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Verification & Reliability</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-medium">
                    <ShieldCheck className="w-4 h-4 text-green-400" /> Verification
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      {provider.verification?.isVerified || provider.verification?.businessRegistration ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                      )}
                      Business Details
                    </li>
                    <li className="flex items-center gap-2">
                      {provider.verification?.isVerified || provider.verification?.phoneNumber ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                      )}
                      Phone Number
                    </li>
                    <li className="flex items-center gap-2">
                      {provider.verification?.isVerified || provider.verification?.address ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                      )}
                      Location Address
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-medium">
                    <Clock className="w-4 h-4 text-blue-400" /> Responsiveness
                  </div>
                  {provider.reputationStats?.responseRate ? (
                    <>
                      <div className="flex items-baseline gap-1 mt-3">
                        <span className="text-2xl font-bold text-white">{provider.reputationStats.responseRate}%</span>
                        <span className="text-sm text-gray-400">response rate</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Usually responds within {provider.reputationStats.responseTimeHours} hours.
                      </p>
                      {provider.reputationStats.responseRate < 50 && (
                        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded flex gap-2 text-xs text-yellow-300">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Provider has a low response rate recently. Bookings may take longer to confirm.</span>
                        </div>
                      )}
                      {provider.handlesEmergencies && provider.reputationStats.urgentResponseTimeHours > 0 && provider.reputationStats.urgentResponseTimeHours <= 1 && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded flex gap-2 text-xs text-red-400">
                          <Zap className="w-4 h-4 shrink-0" />
                          <span>Fast Emergency Response: Typically responds to urgent requests within {provider.reputationStats.urgentResponseTimeHours * 60} minutes.</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">Not enough data to calculate response rate yet.</p>
                  )}
                </div>

                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50 sm:col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-medium">
                    <CheckCircle className="w-4 h-4 text-purple-400" /> Completed Jobs
                  </div>
                  {provider.completedJobsCount !== null && provider.completedJobsCount !== undefined ? (
                    <>
                      <div className="flex items-baseline gap-1 mt-3">
                        <span className="text-2xl font-bold text-white">{provider.completedJobsCount}</span>
                        <span className="text-sm text-gray-400">jobs</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Completed via StudentHub.
                      </p>
                    </>
                  ) : (
                    <div className="flex items-start gap-2 mt-3 text-sm text-gray-400">
                      <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
                      <p>New to StudentHub — no completed jobs yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Available Slot Preview */}
            {provider.schedulingConfig?.slotDurationMinutes ? (
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-300">Next Available Slot</h4>
                    <p className="text-sm text-gray-300">
                      {nextSlot ? `${new Date(nextSlot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${nextSlot.time}` : "Checking availability..."}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm border-0">
                  Book Slot
                </Button>
              </div>
            ) : null}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Location & Area</p>
                  <p className="text-sm text-gray-400">{provider.location.address}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-gray-400 shrink-0 mt-0.5 font-serif font-bold text-lg leading-none">$</span>
                <div>
                  <p className="text-sm font-medium text-gray-200">Pricing Estimate</p>
                  <p className="text-sm text-gray-400">{provider.priceIndicator}</p>
                </div>
              </div>

              {provider.contact?.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Phone</p>
                    <a href={`tel:${provider.contact.phone}`} className="text-sm text-blue-400 hover:underline">
                      {provider.contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {provider.contact?.email && (
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Email</p>
                    <a href={`mailto:${provider.contact.email}`} className="text-sm text-blue-400 hover:underline truncate block w-full max-w-[150px]">
                      {provider.contact.email}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-2" /> Operating Hours
              </h4>
              <div className="bg-gray-900/20 rounded-lg border border-gray-800 overflow-hidden text-sm">
                {provider.operatingHours && provider.operatingHours.length > 0 ? (
                  provider.operatingHours.map((hour, i) => (
                    <div key={hour.day} className={`flex justify-between p-3 ${i !== provider.operatingHours!.length - 1 ? 'border-b border-gray-800/50' : ''}`}>
                      <span className="text-gray-300 w-24 font-medium">{hour.day}</span>
                      <span className={hour.isOpen ? "text-gray-400" : "text-gray-600 italic"}>
                        {hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500 text-center italic">
                    Contact provider for specific hours.
                  </div>
                )}
              </div>
            </div>

            {/* Contact Action */}
            <div className="flex gap-3 mt-4 sticky bottom-0 bg-gray-950 pb-4 pt-2 z-10 border-t border-gray-900 mt-auto">
              <Button 
                variant="outline" 
                className="w-1/3 h-12" 
                size="lg"
                onClick={() => window.location.href = `tel:${provider.contact?.phone}`}
              >
                Call
              </Button>
              <Button 
                className="w-2/3 h-12 text-md font-semibold shadow-lg shadow-blue-500/20" 
                size="lg"
                onClick={() => setIsModalOpen(true)}
              >
                Book Now
              </Button>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <ProviderReviews 
                providerId={provider.id} 
                averageRating={provider.rating} 
                totalReviews={provider.reviewsCount} 
              />
            </div>
            
            <div className="pt-8 flex justify-center">
              <Button variant="ghost" className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 text-xs gap-1.5" onClick={handleReport}>
                <Flag className="w-3 h-3" /> Report this provider
              </Button>
            </div>
          </div>
        )}
      </SheetContent>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-[100vw] h-[100vh] sm:max-w-5xl sm:h-auto sm:max-h-[90vh] p-0 bg-black/95 border-none flex flex-col justify-center overflow-hidden">
          {lightboxIndex !== null && provider?.gallery && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close handled by Dialog primitives, but we add navigation */}
              {lightboxIndex > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute left-2 sm:left-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/80 h-10 w-10 sm:h-12 sm:w-12"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev !== null ? prev - 1 : null)); }}
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              )}
              
              <div className="max-h-full max-w-full p-4 flex flex-col items-center">
                <div className="relative inline-block">
                  <img 
                    src={provider.gallery[lightboxIndex].imageUrl} 
                    alt="Gallery item"
                    className="max-h-[75vh] max-w-full object-contain rounded" 
                  />
                  {provider.gallery[lightboxIndex].type !== 'single' && (
                    <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-widest backdrop-blur-sm">
                      {provider.gallery[lightboxIndex].type}
                    </div>
                  )}
                </div>
                
                {/* Caption / Category Info */}
                {(provider.gallery[lightboxIndex].caption || provider.gallery[lightboxIndex].category) && (
                  <div className="mt-4 text-center max-w-2xl bg-black/50 p-4 rounded-lg">
                    {provider.gallery[lightboxIndex].caption && <p className="text-white text-lg font-medium">{provider.gallery[lightboxIndex].caption}</p>}
                    {provider.gallery[lightboxIndex].category && <p className="text-gray-400 text-sm mt-1">{provider.gallery[lightboxIndex].category}</p>}
                  </div>
                )}
                
                {/* Paired Before/After Link */}
                {getPairedImage(lightboxIndex) && (
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Related Image</p>
                    <div 
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded border-2 border-gray-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors relative"
                      onClick={() => {
                        const targetImg = getPairedImage(lightboxIndex);
                        if (targetImg) {
                          const idx = provider.gallery!.findIndex(img => img._id === targetImg._id);
                          if (idx !== -1) setLightboxIndex(idx);
                        }
                      }}
                    >
                      <img src={getPairedImage(lightboxIndex)!.imageUrl} className="w-full h-full object-cover opacity-80 hover:opacity-100" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-bold text-white uppercase">
                        {getPairedImage(lightboxIndex)!.type}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {lightboxIndex < provider.gallery.length - 1 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 sm:right-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/80 h-10 w-10 sm:h-12 sm:w-12"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev !== null ? prev + 1 : null)); }}
                >
                  <ArrowRight className="w-6 h-6" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {provider && (
        <RequestServiceModal 
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          provider={provider}
          onSuccess={() => {
            toast({ title: "Request Submitted", description: "Your service request has been sent to the provider." });
          }}
        />
      )}
    </Sheet>
  );
}
