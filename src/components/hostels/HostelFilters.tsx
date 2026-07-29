import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export interface FilterState {
  search: string;
  minPrice: string;
  maxPrice: string;
  type: string;
  amenities: string[];
  roomTypes: string[];
  includeFull: boolean;
}

export const defaultFilters: FilterState = {
  search: "",
  minPrice: "",
  maxPrice: "",
  type: "all",
  amenities: [],
  roomTypes: [],
  includeFull: false,
};

interface HostelFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const AMENITIES = ["WiFi", "Mess/Food", "Laundry", "AC", "Non-AC", "Hot Water", "Parking", "Security", "Gym", "Power Backup"];
const ROOM_TYPES = ["single", "shared", "dorm"];

export const HostelFilters = ({ filters, setFilters }: HostelFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleRoomTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(type)
        ? prev.roomTypes.filter(t => t !== type)
        : [...prev.roomTypes, type]
    }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = filters.type !== "all" || filters.minPrice || filters.maxPrice || filters.amenities.length > 0 || filters.roomTypes.length > 0 || filters.search;

  return (
    <div className="bg-secondary/20 p-4 rounded-xl border border-border/50 mb-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search hostels by name, area, or description..." 
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <Button 
          variant={showFilters ? "default" : "outline"} 
          onClick={() => setShowFilters(!showFilters)}
          className="sm:w-auto w-full flex-shrink-0"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" /> 
          Filters
          {hasActiveFilters && !showFilters && <span className="ml-2 w-2 h-2 rounded-full bg-primary" />}
        </Button>
      </div>

      {showFilters && (
        <div className="pt-4 border-t grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2">
          
          <div className="space-y-3">
            <Label>Price Range (₹)</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Min" 
                value={filters.minPrice}
                onChange={e => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                className="h-9"
              />
              <span className="text-muted-foreground">-</span>
              <Input 
                type="number" 
                placeholder="Max" 
                value={filters.maxPrice}
                onChange={e => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Hostel Type</Label>
            <Select 
              value={filters.type} 
              onValueChange={v => setFilters(prev => ({ ...prev, type: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="Boys">Boys Only</SelectItem>
                <SelectItem value="Girls">Girls Only</SelectItem>
                <SelectItem value="Co-ed">Co-ed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <div className="flex justify-between items-center">
              <Label>Room Types</Label>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground">
                  <X className="mr-1 h-3 w-3" /> Clear All
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map(type => (
                <Badge
                  key={type}
                  variant={filters.roomTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer capitalize py-1"
                  onClick={() => handleRoomTypeToggle(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3 sm:col-span-2 lg:col-span-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label>Amenities</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(amenity => (
                <Badge
                  key={amenity}
                  variant={filters.amenities.includes(amenity) ? "default" : "secondary"}
                  className={`cursor-pointer font-normal ${!filters.amenities.includes(amenity) && 'opacity-60 hover:opacity-100'}`}
                  onClick={() => handleAmenityToggle(amenity)}
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 sm:col-span-2 lg:col-span-4 border-t pt-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-input h-4 w-4 text-primary focus:ring-primary"
                checked={filters.includeFull}
                onChange={(e) => setFilters(prev => ({ ...prev, includeFull: e.target.checked }))}
              />
              <span>Show full hostels (no vacancies)</span>
            </Label>
          </div>
          
        </div>
      )}
    </div>
  );
};
