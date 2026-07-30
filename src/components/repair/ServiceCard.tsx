import { ServiceListing } from "@/types/repair";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Clock, ShieldCheck, Zap, Droplet, Wrench, Sparkles } from "lucide-react";

interface ServiceCardProps {
  service: ServiceListing;
  onViewDetails?: (id: string) => void;
}

export const ServiceCard = ({ service, onViewDetails }: ServiceCardProps) => {
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

  return (
    <Card className="hover-lift h-full flex flex-col transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold line-clamp-1">{service.name}</h3>
            <Badge variant="secondary" className="mt-1.5 capitalize font-medium">
              {getCategoryIcon(service.category)}
              {service.category}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-semibold">{service.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({service.reviewsCount} reviews)</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
          {service.description}
        </p>

        <div className="space-y-2.5 text-sm mb-4">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {service.priceIndicator}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{service.location}</span>
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

        <div className="mt-auto grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full" onClick={() => onViewDetails?.(service.id)}>
            View Details
          </Button>
          <Button className="w-full gap-2">
            <Phone className="h-4 w-4" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
