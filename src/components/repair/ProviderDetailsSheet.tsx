import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { ServiceListing } from "@/types/repair";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Share2, Star, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ProviderReviews } from "./ProviderReviews";

interface ProviderDetailsSheetProps {
  providerId: string | null;
  onClose: () => void;
}

export function ProviderDetailsSheet({ providerId, onClose }: ProviderDetailsSheetProps) {
  const [provider, setProvider] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!providerId) {
      setProvider(null);
      return;
    }

    const fetchProvider = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/${providerId}`);
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

  const handleShare = () => {
    if (!provider) return;
    const url = `${window.location.origin}/repair?provider=${provider.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied!", description: "Share link copied to clipboard." });
    });
  };

  const getAvailabilityColor = (status?: string) => {
    if (status === "Open now" || status === "Available 24/7") return "text-green-400 bg-green-400/10 border-green-400/20";
    if (status === "Closed") return "text-red-400 bg-red-400/10 border-red-400/20";
    return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
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
                  <SheetTitle className="text-2xl font-bold text-white">{provider.name}</SheetTitle>
                  <div className="flex items-center space-x-3 mt-2 text-sm">
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      <span className="font-medium text-white">{provider.rating.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({provider.reviewsCount})</span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <Badge variant="outline" className={getAvailabilityColor(provider.availability)}>
                      {provider.availability || "Status unknown"}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleShare} className="text-gray-400 hover:text-white shrink-0">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
              <SheetDescription className="text-gray-300 text-base leading-relaxed">
                {provider.description}
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
            <Button className="w-full h-12 text-md font-semibold mt-4 shadow-lg shadow-blue-500/20" size="lg">
              Contact Provider <ExternalLink className="w-4 h-4 ml-2" />
            </Button>

            <div className="border-t border-gray-800 pt-6">
              <ProviderReviews 
                providerId={provider.id} 
                averageRating={provider.rating} 
                totalReviews={provider.reviewsCount} 
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
