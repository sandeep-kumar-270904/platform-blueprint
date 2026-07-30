import { ServiceListing } from "@/types/repair";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Star, MapPin, Phone, Clock, ShieldCheck, Zap, Droplet, Wrench, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ServiceCardProps {
  service: ServiceListing;
  onViewDetails?: (id: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string, checked: boolean) => void;
  onSaveToggle?: (id: string, isSaved: boolean) => void;
}

export const ServiceCard = ({ service, onViewDetails, isCompared, onToggleCompare, onSaveToggle }: ServiceCardProps) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "electronics": return <Zap className="h-3 w-3 mr-1" />;
      case "plumbing": return <Droplet className="h-3 w-3 mr-1" />;
      case "electrical": return <ShieldCheck className="h-3 w-3 mr-1" />;
      case "cleaning": return <Sparkles className="h-3 w-3 mr-1" />;
      default: return <Wrench className="h-3 w-3 mr-1" />;
    }
  };

  const getAvailabilityColor = (status: string) => {
    if (status.includes("Open now") || status.includes("24/7")) return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    if (status.includes("Closed")) return "text-destructive bg-destructive/10";
    return "text-warning bg-warning/10";
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "Sign in required", description: "You must be signed in to save providers.", variant: "destructive" });
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/repair/${service.id}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && onSaveToggle) {
        onSaveToggle(service.id, data.isSaved);
        toast({ title: data.isSaved ? "Saved!" : "Removed", description: data.message });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not save provider.", variant: "destructive" });
    }
  };

  return (
    <Card className="hover-lift h-full flex flex-col transition-all duration-300 border-border/50 hover:border-primary/30 relative">
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-2 right-2 z-10 h-11 w-11 rounded-full ${service.isSaved ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'text-muted-foreground hover:text-red-500'}`}
        onClick={handleToggleSave}
        aria-label={service.isSaved ? "Remove from saved providers" : "Save provider"}
      >
        <Heart className={`h-5 w-5 ${service.isSaved ? 'fill-current' : ''}`} />
      </Button>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between mb-2 pr-8">
          <div>
            <h3 className="text-xl font-bold line-clamp-1 pr-2">{service.name}</h3>
            <Badge variant="secondary" className="mt-1.5 capitalize font-medium">
              {getCategoryIcon(service.category)}
              {service.category}
            </Badge>
          </div>
          {onToggleCompare && (
            <div className="flex items-center gap-2 shrink-0 bg-secondary/20 px-3 py-2 rounded-md mt-1 cursor-pointer">
              <Checkbox 
                id={`compare-${service.id}`} 
                checked={isCompared}
                onCheckedChange={(checked) => onToggleCompare(service.id, checked as boolean)}
                aria-label={`Compare ${service.name}`}
                className="h-5 w-5"
              />
              <label htmlFor={`compare-${service.id}`} className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                Compare
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between w-full">
          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mt-2">
            {service.verification?.isVerified && (
              <Badge variant="outline" className="text-[10px] uppercase text-green-500 border-green-500/30 bg-green-500/10">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
              </Badge>
            )}
            {service.rating >= 4.5 && service.reviewsCount >= 10 && (
              <Badge variant="outline" className="text-[10px] uppercase text-orange-500 border-orange-500/30 bg-orange-500/10">
                Top Rated
              </Badge>
            )}
          </div>
          
          <div className="text-right">
            <div className="flex items-center justify-end font-bold text-lg text-primary">
              {service.priceIndicator}
            </div>
            <div className="flex items-center justify-end text-sm mt-1">
              {service.reviewsCount === 0 ? (
                <span className="text-muted-foreground flex items-center" aria-label="New provider, no reviews yet">
                  <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> New
                </span>
              ) : (
                <div aria-label={`${service.rating.toFixed(1)} stars out of 5 based on ${service.reviewsCount} reviews`}>
                  <div className="flex items-center" aria-hidden="true">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">{service.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground ml-1">({service.reviewsCount})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
          {service.description}
        </p>

        <div className="space-y-2.5 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{typeof service.location === 'object' ? service.location.address : service.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getAvailabilityColor(service.availability)}`}>
              {service.availability}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {service.services.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline" className="text-xs font-normal text-muted-foreground bg-secondary/30">
              {s}
            </Badge>
          ))}
          {service.services.length > 3 && (
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              +{service.services.length - 3}
            </Badge>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
          <Button variant="outline" className="w-full min-h-[44px]" onClick={() => onViewDetails?.(service.id)} aria-label={`View details for ${service.name}`}>
            View Details
          </Button>
          <Button className="w-full gap-2 min-h-[44px]" aria-label={`Contact ${service.name}`}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
