import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

export interface FilterState {
  minBudget: string;
  maxBudget: string;
  moveInDate: string;
  cleanliness: string;
  sleepSchedule: string;
  smoking: string;
  pets: string;
  guestPolicy: string;
  cookingHabits: string;
  sharedSpaceExpectations: string;
  noiseTolerance: string;
  sortBy: string;
  search: string;
  verifiedOnly: string;
  radius: string;
  lat: string;
  lng: string;
}

const defaultFilters: FilterState = {
  minBudget: "",
  maxBudget: "",
  moveInDate: "",
  cleanliness: "",
  sleepSchedule: "",
  smoking: "",
  pets: "",
  guestPolicy: "",
  cookingHabits: "",
  sharedSpaceExpectations: "",
  noiseTolerance: "",
  sortBy: "match_score_desc",
  search: "",
  verifiedOnly: "false",
  radius: "",
  lat: "",
  lng: ""
};

interface RoommateFiltersProps {
  onApply: (filters: FilterState) => void;
}

export const RoommateFilters: React.FC<RoommateFiltersProps> = ({ onApply }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isOpen, setIsOpen] = useState(false);

  const [localSearch, setLocalSearch] = useState(filters.search || "");

  const onFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    sessionStorage.setItem("roommateFilters", JSON.stringify(newFilters));
    onApply(newFilters);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("roommateFilters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
        setLocalSearch(parsed.search || "");
      } catch (e) {
        console.error("Error parsing saved filters", e);
      }
    }
  }, []);

  // Debounce logic for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, filters]);

  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFilters(prev => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
          radius: prev.radius || "5"
        }));
      }, (error) => {
        console.error("Error getting location", error);
        alert("Could not detect location. Please check browser permissions.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const activeCount = Object.keys(filters).filter(k => 
    k !== 'sortBy' && k !== 'search' && k !== 'verifiedOnly' && k !== 'radius' && k !== 'lat' && k !== 'lng' && filters[k as keyof FilterState] !== ""
  ).length;

  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button 
              variant={isOpen ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setIsOpen(!isOpen)}
              className="gap-2 shrink-0 min-h-[44px]"
              aria-expanded={isOpen}
              aria-controls="filters-panel"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters {activeCount > 0 && <Badge variant="default" className="ml-1 h-5 px-1">{activeCount}</Badge>}
            </Button>

            <div className="relative flex-1 max-w-sm hidden sm:block">
              <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                aria-label="Search matches"
                placeholder="Search matches by name, college, location, or bio..."
                className="pl-9 pr-8 min-h-[44px] text-sm"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              {localSearch && (
                <button 
                  onClick={() => setLocalSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-3.5 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] -mt-3 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="hidden sm:block shrink-0">
              <Select value={filters.sortBy || 'compatibility'} onValueChange={v => onFilterChange({...filters, sortBy: v})}>
                <SelectTrigger className="w-[160px] min-h-[44px]" aria-label="Sort by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compatibility">Best Match</SelectItem>
                  <SelectItem value="recent">Newest Profiles</SelectItem>
                  <SelectItem value="budget">Lowest Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex w-full sm:hidden gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                aria-label="Search matches"
                placeholder="Search matches..."
                className="pl-9 pr-8 min-h-[44px] text-sm"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              {localSearch && (
                <button 
                  onClick={() => setLocalSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-3.5 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] -mt-3 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="shrink-0 w-[140px]">
              <Select value={filters.sortBy || 'compatibility'} onValueChange={v => onFilterChange({...filters, sortBy: v})}>
                <SelectTrigger className="w-full min-h-[44px]" aria-label="Sort by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compatibility">Best Match</SelectItem>
                  <SelectItem value="recent">Newest</SelectItem>
                  <SelectItem value="budget">Lowest Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-xs">Budget Range ($)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" inputMode="numeric" placeholder="Min" aria-label="Minimum budget" className="min-h-[44px] text-sm" value={filters.minBudget} onChange={e => onFilterChange({...filters, minBudget: e.target.value})} />
                <span className="text-muted-foreground">-</span>
                <Input type="number" inputMode="numeric" placeholder="Max" aria-label="Maximum budget" className="min-h-[44px] text-sm" value={filters.maxBudget} onChange={e => onFilterChange({...filters, maxBudget: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <Label className="text-sm font-semibold">Location Radius (km)</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" type="button" onClick={handleLocationDetection} className={filters.lat ? "bg-primary text-primary-foreground" : ""}>
                  Use My Location
                </Button>
                {filters.lat && (
                  <Select value={filters.radius} onValueChange={(val) => setFilters(prev => ({ ...prev, radius: val }))}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 km</SelectItem>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {filters.lat && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setFilters(prev => ({ ...prev, lat: "", lng: "", radius: "" }))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!filters.lat && <p className="text-xs text-muted-foreground mt-1">Enable location to filter by distance.</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Move-in After</Label>
              <Input type="date" aria-label="Move in after" className="min-h-[44px] text-sm" value={filters.moveInDate} onChange={e => onFilterChange({...filters, moveInDate: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cleanliness</Label>
              <Select value={filters.cleanliness} onValueChange={v => onFilterChange({...filters, cleanliness: v === 'any' ? '' : v})}>
                <SelectTrigger aria-label="Cleanliness filter" className="min-h-[44px] text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="Messy">Messy</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Clean">Clean</SelectItem>
                  <SelectItem value="Neat Freak">Neat Freak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Sleep Schedule</Label>
              <Select value={filters.sleepSchedule} onValueChange={v => onFilterChange({...filters, sleepSchedule: v === 'any' ? '' : v})}>
                <SelectTrigger aria-label="Sleep schedule filter" className="min-h-[44px] text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="Early Bird">Early Bird</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                  <SelectItem value="Night Owl">Night Owl</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 self-end pb-2">
              <Switch 
                id="verifiedOnly" 
                checked={filters.verifiedOnly === "true"}
                onCheckedChange={(c) => onFilterChange({ ...filters, verifiedOnly: c ? "true" : "false" })}
              />
              <Label htmlFor="verifiedOnly" className="cursor-pointer text-xs font-medium">
                Verified Only
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Smoking</Label>
              <Select value={filters.smoking} onValueChange={v => onFilterChange({...filters, smoking: v === 'any' ? '' : v})}>
                <SelectTrigger aria-label="Smoking filter" className="min-h-[44px] text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Outside only">Outside only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Pets</Label>
              <Select value={filters.pets} onValueChange={v => onFilterChange({...filters, pets: v === 'any' ? '' : v})}>
                <SelectTrigger aria-label="Pets filter" className="min-h-[44px] text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="Cats only">Cats only</SelectItem>
                  <SelectItem value="Dogs only">Dogs only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 md:col-span-3 lg:col-span-6 flex justify-end gap-2 pt-2">
              <Button variant="outline" className="w-full mt-4 min-h-[44px]" onClick={() => onFilterChange({
                minBudget: "", maxBudget: "", moveInDate: "", cleanliness: "", sleepSchedule: "", smoking: "", pets: "",
                guestPolicy: "", cookingHabits: "", sharedSpaceExpectations: "", noiseTolerance: "", sortBy: "compatibility", search: localSearch
              })}>
                Reset Filters
              </Button>
            </div>
          </div>
        )}

        {isOpen && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">More Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Guest Policy</Label>
                <Select value={filters.guestPolicy} onValueChange={(v) => onFilterChange({...filters, guestPolicy: v === 'any' ? '' : v})}>
                  <SelectTrigger aria-label="Guest policy filter" className="min-h-[44px]"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Strictly No Guests">Strictly No Guests</SelectItem>
                    <SelectItem value="Rarely">Rarely</SelectItem>
                    <SelectItem value="Occasionally">Occasionally</SelectItem>
                    <SelectItem value="Frequently">Frequently</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Cooking Habits</Label>
                <Select value={filters.cookingHabits} onValueChange={(v) => onFilterChange({...filters, cookingHabits: v === 'any' ? '' : v})}>
                  <SelectTrigger aria-label="Cooking habits filter" className="min-h-[44px]"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Rarely Cooks">Rarely Cooks</SelectItem>
                    <SelectItem value="Cooks Often - Keeps Separate">Cooks Often - Keeps Separate</SelectItem>
                    <SelectItem value="Cooks Often - Shares Meals">Cooks Often - Shares Meals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Shared Space</Label>
                <Select value={filters.sharedSpaceExpectations} onValueChange={(v) => onFilterChange({...filters, sharedSpaceExpectations: v === 'any' ? '' : v})}>
                  <SelectTrigger aria-label="Shared space filter" className="min-h-[44px]"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Strictly Separate">Strictly Separate</SelectItem>
                    <SelectItem value="Happy to Share">Happy to Share</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Noise Tolerance</Label>
                <Select value={filters.noiseTolerance} onValueChange={(v) => onFilterChange({...filters, noiseTolerance: v === 'any' ? '' : v})}>
                  <SelectTrigger aria-label="Noise tolerance filter" className="min-h-[44px]"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
