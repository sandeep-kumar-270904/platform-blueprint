import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Grid3x3, List, ChevronDown, X } from "lucide-react";
import { NotesFilters } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";

interface NotesFilterBarProps {
  filters: NotesFilters;
  onFilterChange: <K extends keyof NotesFilters>(key: K, value: NotesFilters[K]) => void;
  subjects: string[];
  categories: string[];
  branches: string[];
  semesters: (number | null)[];
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onBatchUploadClick: () => void;
}

export const NotesFilterBar = ({
  filters,
  onFilterChange,
  subjects,
  categories,
  branches,
  viewMode,
  onViewModeChange,
  onBatchUploadClick,
}: NotesFilterBarProps) => {
  const { user } = useAuth();

  const activeFilters = [
    { key: "selectedSubject", label: "Subject", value: filters.selectedSubject },
    { key: "selectedCategory", label: "Category", value: filters.selectedCategory },
    { key: "selectedBranch", label: "Branch", value: filters.selectedBranch },
    { key: "selectedSemester", label: "Semester", value: filters.selectedSemester ? `Sem ${filters.selectedSemester}` : null },
  ].filter(f => f.value !== null);

  const removeFilter = (key: keyof NotesFilters) => {
    onFilterChange(key, null as any);
  };

  return (
    <div className="space-y-3">
      {/* Unified Control Row */}
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-end">


        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={filters.selectedSubject || "all"}
            onValueChange={(v) => onFilterChange("selectedSubject", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[160px] h-10 border-border bg-background rounded-lg">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium truncate">{filters.selectedSubject || "All"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 border-border bg-background rounded-lg text-muted-foreground gap-2 font-normal justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">More Filters</span>
                  {(filters.selectedCategory || filters.selectedBranch || filters.selectedSemester) && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                      {[filters.selectedCategory, filters.selectedBranch, filters.selectedSemester].filter(Boolean).length}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filters.selectedCategory || "all"} onValueChange={(v) => onFilterChange("selectedCategory", v === "all" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={filters.selectedBranch || "all"} onValueChange={(v) => onFilterChange("selectedBranch", v === "all" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={filters.sortBy} onValueChange={(v) => onFilterChange("sortBy", v)}>
            <SelectTrigger className="w-[160px] h-10 border-border bg-background rounded-lg">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-muted-foreground">Sort:</span>
                <span className="font-medium truncate">
                  {filters.sortBy === 'newest' && 'Newest'}
                  {filters.sortBy === 'oldest' && 'Oldest'}
                  {filters.sortBy === 'popular' && 'Most Viewed'}
                  {filters.sortBy === 'top-rated' && 'Top Rated'}
                  {filters.sortBy === 'most-downloaded' && 'Most Downloaded'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Viewed</SelectItem>
              <SelectItem value="top-rated">Top Rated</SelectItem>
              <SelectItem value="most-downloaded">Most Downloaded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-border hidden xl:block mx-1"></div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-md transition-all duration-120 ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary" : "text-muted-foreground bg-transparent hover:text-foreground hover:bg-muted/50"}`}
              onClick={() => onViewModeChange("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-md transition-all duration-120 ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary" : "text-muted-foreground bg-transparent hover:text-foreground hover:bg-muted/50"}`}
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={onBatchUploadClick}
            disabled={!user}
            variant="outline"
            className="h-10 border-border text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors active:scale-[0.97]"
          >
            Batch upload
          </Button>
        </div>
      </div>

      {/* Active Filters Chip Row */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-muted-foreground mr-1">Active filters:</span>
          {activeFilters.map(filter => (
            <div 
              key={filter.key} 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground transition-all hover:bg-muted"
            >
              {filter.label}: {filter.value}
              <button 
                onClick={() => removeFilter(filter.key as keyof NotesFilters)}
                className="text-muted-foreground hover:text-foreground rounded-full hover:bg-background p-0.5 transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              activeFilters.forEach(f => removeFilter(f.key as keyof NotesFilters));
            }}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};
