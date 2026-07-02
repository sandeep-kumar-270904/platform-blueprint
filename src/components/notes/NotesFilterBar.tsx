import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3x3, List, Upload, TrendingUp, X, Tag } from "lucide-react";
import { NotesFilters } from "@/hooks/useNotes";

interface NotesFilterBarProps {
  filters: NotesFilters;
  onFilterChange: <K extends keyof NotesFilters>(key: K, value: NotesFilters[K]) => void;
  subjects: string[];
  categories: string[];
  branches: string[];
  semesters: (number | null)[];
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onUploadClick: () => void;
  onBatchUploadClick: () => void;
}

export const NotesFilterBar = ({
  filters,
  onFilterChange,
  subjects,
  categories,
  branches,
  semesters,
  viewMode,
  onViewModeChange,
  onUploadClick,
  onBatchUploadClick,
}: NotesFilterBarProps) => {
  return (
    <div className="mb-6 space-y-3">
      {/* Search + Sort + Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, subject, tags..."
            className="pl-10"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filters.sortBy} onValueChange={(v) => onFilterChange("sortBy", v)}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Viewed</SelectItem>
              <SelectItem value="top-rated">Top Rated</SelectItem>
              <SelectItem value="most-downloaded">Most Downloaded</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => onViewModeChange("grid")}>
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => onViewModeChange("list")}>
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={onUploadClick} size="sm" className="h-9">
            <Upload className="mr-1.5 h-3.5 w-3.5" />Upload
          </Button>
          <Button onClick={onBatchUploadClick} variant="secondary" size="sm" className="h-9">
            <Upload className="mr-1.5 h-3.5 w-3.5" />Batch
          </Button>
        </div>
      </div>

      {/* Subject chips */}
      <div className="flex flex-wrap gap-2">
        <Button variant={!filters.selectedSubject ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onFilterChange("selectedSubject", null)}>
          All Subjects
        </Button>
        {subjects.map((subject) => (
          <Button
            key={subject}
            variant={filters.selectedSubject === subject ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onFilterChange("selectedSubject", filters.selectedSubject === subject ? null : subject)}
          >
            {subject}
            {filters.selectedSubject === subject && (
              <X className="ml-1 h-3 w-3" onClick={(e) => { e.stopPropagation(); onFilterChange("selectedSubject", null); }} />
            )}
          </Button>
        ))}
      </div>

      {/* Branch + Semester row */}
      {(branches.length > 0 || semesters.length > 0) && (
        <div className="flex flex-wrap gap-2 items-center">
          {branches.length > 0 && (
            <Select
              value={filters.selectedBranch || "all"}
              onValueChange={(v) => onFilterChange("selectedBranch", v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[140px] h-7 text-xs">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b} value={b as string}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {semesters.length > 0 && (
            <Select
              value={filters.selectedSemester || "all"}
              onValueChange={(v) => onFilterChange("selectedSemester", v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[140px] h-7 text-xs">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((s) => (
                  <SelectItem key={String(s)} value={String(s)}>Sem {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground mt-1" />
          <Button variant={!filters.selectedCategory ? "secondary" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onFilterChange("selectedCategory", null)}>
            All Categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filters.selectedCategory === cat ? "secondary" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onFilterChange("selectedCategory", filters.selectedCategory === cat ? null : (cat as string))}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
