import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ServiceListing } from "@/types/repair";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: ServiceListing[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({ open, onOpenChange, providers, onRemove, onClear }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] sm:h-[60vh] flex flex-col p-0">
        <SheetHeader className="p-4 border-b shrink-0 flex-row justify-between items-center">
          <SheetTitle>Compare Providers ({providers.length}/3)</SheetTitle>
          {providers.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear all compared providers" className="text-muted-foreground hover:text-foreground min-h-[44px]">
              Clear All
            </Button>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-auto p-4">
          {providers.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select up to 3 providers to compare them side-by-side.
            </div>
          ) : (
            <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {providers.map((p) => (
                <div key={p.id} className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 border rounded-lg p-4 space-y-4 relative bg-card snap-center shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-8 w-8 rounded-full bg-muted/50 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onRemove(p.id)}
                    aria-label={`Remove ${p.name} from comparison`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>

                  <div>
                    <h3 className="font-bold text-lg line-clamp-1 pr-6">{p.name}</h3>
                    <Badge variant="secondary" className="mt-1 capitalize">{p.category}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t pt-4">
                    <div className="text-muted-foreground">Rating</div>
                    <div className="flex items-center gap-1 font-medium" aria-label={`${p.rating.toFixed(1)} stars based on ${p.reviewsCount} reviews`}>
                      <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
                      <span aria-hidden="true">{p.rating.toFixed(1)} ({p.reviewsCount})</span>
                    </div>

                    <div className="text-muted-foreground">Price</div>
                    <div className="font-medium">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {p.priceIndicator}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground">Availability</div>
                    <div className={`font-medium ${p.availability.includes('Open now') || p.availability.includes('24/7') ? 'text-green-600 dark:text-green-400' : 'text-warning'}`}>
                      {p.availability}
                    </div>

                    <div className="text-muted-foreground">Location</div>
                    <div className="flex items-start gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{p.location.address}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-xs text-muted-foreground mb-2">Key Specialties</div>
                    <div className="flex flex-wrap gap-1">
                      {p.services.slice(0, 4).map(s => (
                        <Badge key={s} variant="outline" className="text-xs font-normal">
                          {s}
                        </Badge>
                      ))}
                      {p.services.length > 4 && (
                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                          +{p.services.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
