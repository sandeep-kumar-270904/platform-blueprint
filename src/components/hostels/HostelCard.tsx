import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, ShieldCheck, Heart, Flag, Building2, Star } from "lucide-react";
import { Hostel, useReportHostel } from "@/hooks/useHostels";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSavedHostelIds, useToggleSaveHostel } from "@/hooks/useSavedHostels";
import { Button } from "@/components/ui/button";

interface HostelCardProps {
  hostel: Hostel;
  onClick: () => void;
}

export const HostelCard = ({ hostel, onClick }: HostelCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: savedHostels = [] } = useSavedHostelIds(user?._id);
  const toggleSaveMutation = useToggleSaveHostel();
  const reportMutation = useReportHostel();

  const isSaved = savedHostels.includes(hostel._id);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save this hostel.",
      });
      return;
    }
    toggleSaveMutation.mutate({ userId: user._id, hostelId: hostel._id, isCurrentlySaved: isSaved });
  };

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col group ${hostel.isFull ? 'opacity-80 grayscale-[0.5]' : ''}`}
      onClick={onClick}
    >
      <div className="relative h-48 bg-muted overflow-hidden">
        {hostel.photos && hostel.photos.length > 0 ? (
          <img 
            src={`http://localhost:5000${hostel.photos[hostel.coverPhotoIndex || 0] || hostel.photos[0]}`} 
            alt={hostel.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary group-hover:bg-secondary/80 transition-colors">
            <Building2 className="h-12 w-12 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {hostel.verificationStatus === "verified" && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-sm border-none backdrop-blur-sm bg-emerald-500/90">
              <ShieldCheck className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
          {hostel.isFull && (
            <Badge variant="destructive" className="shadow-sm uppercase font-bold tracking-wider">
              Full
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm">
            {hostel.type}
          </Badge>
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-background/50 hover:bg-background/90 backdrop-blur-sm rounded-full w-8 h-8 shadow-sm"
            onClick={handleSaveClick}
            disabled={toggleSaveMutation.isPending}
            title={isSaved ? "Unsave Hostel" : "Save Hostel"}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-foreground"}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/50 hover:bg-destructive/90 hover:text-destructive-foreground backdrop-blur-sm rounded-full w-8 h-8 shadow-sm text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
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
            title="Report Listing"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg line-clamp-1 flex-1 pr-2" title={hostel.name}>
            {hostel.name}
          </h3>
          <div className="text-right whitespace-nowrap">
            <p className="font-bold text-primary">₹{hostel.pricing.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">/ month onwards</p>
            {hostel.deposit?.amount > 0 && (
              <p className="text-[10px] font-medium text-amber-600 mt-0.5">
                + ₹{hostel.deposit.amount.toLocaleString()} dep.
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center text-sm mb-3">
          <Star className={`w-4 h-4 mr-1 ${hostel.rating > 0 ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
          <span className="font-medium mr-1">{hostel.rating > 0 ? hostel.rating.toFixed(1) : 'New'}</span>
          <span className="text-muted-foreground text-xs">
            ({hostel.reviewCount} {hostel.reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{hostel.address}</span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
          {hostel.description}
        </p>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{hostel.availableBeds} beds left</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {hostel.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {amenity}
              </Badge>
            ))}
            {hostel.amenities.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                +{hostel.amenities.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
