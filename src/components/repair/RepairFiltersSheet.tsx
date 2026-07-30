import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export interface RepairFilters {
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  openNow?: boolean;
}

interface RepairFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RepairFilters;
  onApplyFilters: (filters: RepairFilters) => void;
}

export const RepairFiltersSheet: React.FC<RepairFiltersSheetProps> = ({ open, onOpenChange, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = React.useState<RepairFilters>(filters);

  // Sync when sheet opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const cleared = {};
    setLocalFilters(cleared);
    onApplyFilters(cleared);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Narrow down repair providers by pricing, rating, and availability.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="min-rating" className="text-base font-semibold">Minimum Rating</Label>
              <span className="text-sm text-muted-foreground">{localFilters.minRating || 0} Stars</span>
            </div>
            <Slider 
              id="min-rating"
              value={[localFilters.minRating || 0]} 
              min={0} max={5} step={0.5} 
              onValueChange={val => setLocalFilters(prev => ({ ...prev, minRating: val[0] }))}
              aria-label="Minimum Rating Slider"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-price" className="text-base font-semibold">Maximum Price</Label>
              <span className="text-sm text-muted-foreground">
                {localFilters.priceMax ? `$${localFilters.priceMax}` : 'Any'}
              </span>
            </div>
            <Slider 
              id="max-price"
              value={[localFilters.priceMax || 500]} 
              min={10} max={500} step={10} 
              onValueChange={val => setLocalFilters(prev => ({ ...prev, priceMax: val[0] === 500 ? undefined : val[0] }))}
              aria-label="Maximum Price Slider"
            />
            <p className="text-xs text-muted-foreground">Slide to 500 for Any price.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="open-now" className="text-base font-semibold">Open Now Only</Label>
                <p className="text-sm text-muted-foreground">Show providers currently open.</p>
              </div>
              <Switch 
                id="open-now"
                checked={localFilters.openNow || false}
                onCheckedChange={val => setLocalFilters(prev => ({ ...prev, openNow: val }))}
                aria-label="Toggle open now only"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClear} className="min-h-[44px]">Clear All</Button>
          <Button onClick={handleApply} className="min-h-[44px]">Apply Filters</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
