import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3x3, List, Upload, TrendingUp, X, Tag } from "lucide-react";
import { NotesFilters } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  return (
    <div className="mb-6 space-y-4">
      {/* Search + Sort + Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-full w-full">
          <label htmlFor="search-notes" className="sr-only">Search notes by title, subject, tags</label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="search-notes"
            placeholder="Search notes by title, subject, tags..."
            className="pl-10 h-8 w-full md:max-w-xl border-[var(--color-border)] focus-visible:ring-[var(--color-accent)]"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange("searchQuery", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 flex-wrap w-full md:w-auto justify-between md:justify-end">
          {/* Group A: Sort & View */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="sort-notes" className="sr-only">Sort notes</label>
            <Select value={filters.sortBy} onValueChange={(v) => onFilterChange("sortBy", v)}>
              <SelectTrigger id="sort-notes" className="w-[150px] h-8 text-xs border-[var(--color-border)]">
                <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
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
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8 shrink-0" onClick={() => onViewModeChange("grid")} aria-label="Grid view">
              <Grid3x3 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8 shrink-0" onClick={() => onViewModeChange("list")} aria-label="List view">
              <List className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          
          {/* Group B: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div title={!user ? "Please sign in to upload notes" : undefined}>
              <Button onClick={onUploadClick} disabled={!user} size="sm" className="h-8 px-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-[var(--color-text-inverse)]">
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />Upload
              </Button>
            </div>
            <div title={!user ? "Please sign in to batch upload" : undefined}>
              <Button onClick={onBatchUploadClick} disabled={!user} variant="outline" size="sm" className="h-8 px-4 border-[var(--color-border)] text-[var(--color-text-primary)]">
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />Batch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subject chips */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={!filters.selectedSubject ? "default" : "outline"} 
          size="sm" 
          className={`h-8 px-4 rounded-full chip-label ${!filters.selectedSubject ? 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
          onClick={() => onFilterChange("selectedSubject", null)}
        >
          All Subjects
        </Button>
        {subjects.map((subject) => (
          <Button
            key={subject}
            variant={filters.selectedSubject === subject ? "default" : "outline"}
            size="sm"
            className={`h-8 px-4 rounded-full chip-label ${filters.selectedSubject === subject ? 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] font-bold' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'}`}
            onClick={() => onFilterChange("selectedSubject", filters.selectedSubject === subject ? null : subject)}
          >
            {filters.selectedSubject === subject && <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
            {subject}
          </Button>
        ))}
      </div>

      {/* Branch + Semester row */}
      {(branches.length > 0 || semesters.length > 0) && (
        <div className="flex flex-wrap gap-2 items-center">
          {branches.length > 0 && (
            <div>
              <label htmlFor="filter-branch" className="sr-only">Filter by Branch</label>
              <Select
                value={filters.selectedBranch || "all"}
                onValueChange={(v) => onFilterChange("selectedBranch", v === "all" ? null : v)}
              >
                <SelectTrigger id="filter-branch" className="w-[140px] h-8 text-xs border-[var(--color-border)] rounded-full">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b as string}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {semesters.length > 0 && (
            <div>
              <label htmlFor="filter-semester" className="sr-only">Filter by Semester</label>
              <Select
                value={filters.selectedSemester || "all"}
                onValueChange={(v) => onFilterChange("selectedSemester", v === "all" ? null : v)}
              >
                <SelectTrigger id="filter-semester" className="w-[140px] h-8 text-xs border-[var(--color-border)] rounded-full">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((s) => (
                    <SelectItem key={String(s)} value={String(s)}>Sem {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Category chips */}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="h-3.5 w-3.5 text-muted-foreground mr-1" aria-hidden="true" />
          <Button 
            variant={!filters.selectedCategory ? "secondary" : "outline"} 
            size="sm" 
            className={`h-6 px-3 chip-label ${!filters.selectedCategory ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'}`}
            onClick={() => onFilterChange("selectedCategory", null)}
          >
            All Categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filters.selectedCategory === cat ? "secondary" : "outline"}
              size="sm"
              className={`h-6 px-3 chip-label ${filters.selectedCategory === cat ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'}`}
              onClick={() => onFilterChange("selectedCategory", filters.selectedCategory === cat ? null : (cat as string))}
            >
              {filters.selectedCategory === cat && <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
              {cat}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
