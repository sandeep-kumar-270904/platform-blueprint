import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, X, Tag, Filter, SortDesc, FileText, Video, Code, BookOpen, Check 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CreatorsFilterBarProps {
  selectedFilter: string;
  selectedTag: string;
  sortBy: string;
  searchInput: string;
  onSearchChange: (val: string) => void;
  onClearSearch: () => void;
  onFilterChange: (val: string) => void;
  onSortChange: (val: string) => void;
  onTagChange: (val: string) => void;
  popularTags: string[];
  totalResultsCount: number;
  onResetAll: () => void;
}

export const CreatorsFilterBar: React.FC<CreatorsFilterBarProps> = ({
  selectedFilter,
  selectedTag,
  sortBy,
  searchInput,
  onSearchChange,
  onClearSearch,
  onFilterChange,
  onSortChange,
  onTagChange,
  popularTags,
  totalResultsCount,
  onResetAll
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFilterCount = 
    (selectedFilter !== "all" ? 1 : 0) + 
    (selectedTag !== "all" ? 1 : 0) + 
    (sortBy !== "recent" ? 1 : 0) + 
    (searchInput.trim() ? 1 : 0);

  return (
    <section aria-label="Content search and filters" className="space-y-4">
      {/* Top row: Search input and Mobile Filter Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search Creators Zone by title, description, or tags"
            placeholder="Search tutorials, projects, topics..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-11 text-sm rounded-full bg-muted/40 border-border/60 focus:bg-background focus-visible:ring-2 focus-visible:ring-primary transition-colors min-h-[44px]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search input"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Sheet Trigger (< md screens) */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMobileFilterOpen(true)}
            aria-label={`Open filter and sort panel. ${activeFilterCount} active filters`}
            className="flex-1 h-11 rounded-full border-border/60 font-semibold flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Filter className="h-4 w-4 text-primary" />
            <span>Filters & Sort</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 px-2 py-0.5 text-[10px] rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetAll}
              aria-label="Reset all filters"
              className="h-11 px-3 rounded-full text-destructive hover:bg-destructive/10 min-h-[44px]"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Desktop Filter / Sort Controls (>= md screens) */}
        <div className="hidden md:flex items-center gap-4 justify-end">
          {/* Content Type Filter */}
          <div role="tablist" aria-label="Filter by content type" className="flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/40 text-xs font-medium">
            {[
              { id: "all", label: "All" },
              { id: "article", label: "Articles" },
              { id: "video", label: "Videos" },
              { id: "project", label: "Projects" },
              { id: "resource", label: "Resources" }
            ].map((type) => (
              <button
                type="button"
                role="tab"
                key={type.id}
                aria-selected={selectedFilter === type.id}
                onClick={() => onFilterChange(type.id)}
                className={`px-3 py-1.5 rounded-full transition-all font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] md:min-h-[36px] ${
                  selectedFilter === type.id 
                    ? "bg-background shadow-sm text-primary font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Sort Order */}
          <div role="tablist" aria-label="Sort content by" className="flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border/40 text-xs font-medium">
            {[
              { id: "recent", label: "Recent" },
              { id: "viewed", label: "Most Viewed" },
              { id: "liked", label: "Most Liked" }
            ].map((s) => (
              <button
                type="button"
                role="tab"
                key={s.id}
                aria-selected={sortBy === s.id}
                onClick={() => onSortChange(s.id)}
                className={`px-3 py-1.5 rounded-full transition-all font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] md:min-h-[36px] ${
                  sortBy === s.id 
                    ? "bg-background shadow-sm text-primary font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Topics / Tags Row (>= md screens) */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 pt-1 border-b border-border/30 text-xs scrollbar-none">
        <span className="text-muted-foreground font-semibold flex items-center gap-1.5 shrink-0 mr-1" aria-hidden="true">
          <Tag className="h-3.5 w-3.5 text-primary" /> Topics:
        </span>
        
        <button
          type="button"
          aria-pressed={selectedTag === "all"}
          onClick={() => onTagChange("all")}
          className={`px-3.5 py-1.5 rounded-full border transition-all font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] sm:min-h-[36px] ${
            selectedTag === "all" 
              ? "bg-primary text-primary-foreground border-primary shadow-sm font-bold" 
              : "bg-muted/30 border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
          }`}
        >
          All Topics
        </button>

        {popularTags.map((tag) => (
          <button
            type="button"
            key={tag}
            aria-pressed={selectedTag.toLowerCase() === tag.toLowerCase()}
            onClick={() => onTagChange(tag)}
            className={`px-3.5 py-1.5 rounded-full border transition-all font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] sm:min-h-[36px] ${
              selectedTag.toLowerCase() === tag.toLowerCase() 
                ? "bg-primary text-primary-foreground border-primary shadow-sm font-bold" 
                : "bg-muted/30 border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Filter Status summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/20 border border-border/40 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Showing {totalResultsCount} results</span>
          {activeFilterCount > 0 && (
            <span className="text-muted-foreground/80">
              (Filtered by {selectedFilter !== "all" ? `${selectedFilter}s` : "all types"}
              {selectedTag !== "all" ? `, #${selectedTag}` : ""} • sorted by {sortBy})
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetAll}
            aria-label="Clear all active filters and reset view"
            className="text-primary hover:underline font-semibold flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1.5 py-1 min-h-[44px] sm:min-h-[36px]"
          >
            <X className="h-3.5 w-3.5" />
            Reset all filters
          </button>
        )}
      </div>

      {/* Mobile Filter Modal (< md screens) */}
      <Dialog open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <DialogContent aria-describedby="mobile-filter-desc" className="sm:max-w-md p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter & Sort Creators Content
            </DialogTitle>
          </DialogHeader>

          <div id="mobile-filter-desc" className="space-y-6 py-2">
            {/* Content Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">Content Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "all", label: "All Types" },
                  { id: "article", label: "Articles" },
                  { id: "video", label: "Videos" },
                  { id: "project", label: "Projects" },
                  { id: "resource", label: "Resources" }
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => onFilterChange(t.id)}
                    className={`p-3 rounded-xl border text-left font-semibold text-sm transition-all flex items-center justify-between min-h-[44px] ${
                      selectedFilter === t.id 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border/60 bg-card hover:bg-muted/40"
                    }`}
                  >
                    <span>{t.label}</span>
                    {selectedFilter === t.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">Sort Order</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "recent", label: "Recent" },
                  { id: "viewed", label: "Viewed" },
                  { id: "liked", label: "Liked" }
                ].map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => onSortChange(s.id)}
                    className={`p-3 rounded-xl border text-center font-semibold text-sm transition-all min-h-[44px] ${
                      sortBy === s.id 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border/60 bg-card hover:bg-muted/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics / Tags */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">Topics & Tags</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() => onTagChange("all")}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all min-h-[40px] ${
                    selectedTag === "all" 
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm" 
                      : "bg-muted/30 border-border/60 text-muted-foreground"
                  }`}
                >
                  All Topics
                </button>
                {popularTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => onTagChange(tag)}
                    className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all min-h-[40px] ${
                      selectedTag.toLowerCase() === tag.toLowerCase() 
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm" 
                        : "bg-muted/30 border-border/60 text-muted-foreground"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border/40">
            {activeFilterCount > 0 && (
              <Button 
                type="button"
                variant="outline" 
                onClick={() => { onResetAll(); setMobileFilterOpen(false); }} 
                className="w-full sm:w-auto min-h-[44px]"
              >
                Reset All Filters
              </Button>
            )}
            <Button 
              type="button"
              onClick={() => setMobileFilterOpen(false)} 
              className="w-full sm:w-auto font-bold min-h-[44px]"
            >
              Show Results ({totalResultsCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
