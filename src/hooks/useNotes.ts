import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";

export interface NotesFilters {
  searchQuery: string;
  selectedSubject: string | null;
  selectedCategory: string | null;
  selectedBranch: string | null;
  selectedSemester: string | null;
  sortBy: string;
}

const defaultFilters: NotesFilters = {
  searchQuery: "",
  selectedSubject: null,
  selectedCategory: null,
  selectedBranch: null,
  selectedSemester: null,
  sortBy: "newest",
};

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/notes` : "http://localhost:5000/api/notes";

export const useNotes = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialFilters = useMemo(() => {
    return {
      searchQuery: searchParams.get("q") || defaultFilters.searchQuery,
      selectedSubject: searchParams.get("subject") || defaultFilters.selectedSubject,
      selectedCategory: searchParams.get("category") || defaultFilters.selectedCategory,
      selectedBranch: searchParams.get("branch") || defaultFilters.selectedBranch,
      selectedSemester: searchParams.get("semester") || defaultFilters.selectedSemester,
      sortBy: searchParams.get("sort") || defaultFilters.sortBy,
    };
  }, []);

  const [notes, setNotes] = useState<any[]>([]);
  const [bookmarkedNoteIds, setBookmarkedNoteIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<NotesFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync filters to URL when they change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.set("q", filters.searchQuery);
    if (filters.selectedSubject) params.set("subject", filters.selectedSubject);
    if (filters.selectedCategory) params.set("category", filters.selectedCategory);
    if (filters.selectedBranch) params.set("branch", filters.selectedBranch);
    if (filters.selectedSemester) params.set("semester", filters.selectedSemester);
    if (filters.sortBy !== "newest") params.set("sort", filters.sortBy);
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.map((n: any) => ({ id: n._id, ...n })));
      } else {
        throw new Error("Failed to load notes");
      }
    } catch (err) {
      console.error("Failed to load notes", err);
      setError("Unable to connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const myNotes = user ? notes.filter((n) => n.user_id === user.id) : [];
  const bookmarkedNotes = notes.filter((n) => bookmarkedNoteIds.has(n.id));

  const subjects = Array.from(new Set(notes.map((n) => n.subject).filter(Boolean)));
  const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));
  const branches = Array.from(new Set(notes.map((n) => n.branch).filter(Boolean)));
  const semesters = Array.from(new Set(notes.map((n) => n.semester).filter(Boolean))).sort(
    (a, b) => Number(a) - Number(b)
  );

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(filters.searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(filters.searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  const getFilteredNotes = useCallback(
    (notesList: any[]) => {
      const q = debouncedSearchQuery.toLowerCase();
      const filtered = notesList.filter((note) => {
        const matchesSearch =
          !q ||
          note.title?.toLowerCase().includes(q) ||
          note.subject?.toLowerCase().includes(q) ||
          (note.description || "").toLowerCase().includes(q) ||
          (note.tags || []).some((tag: string) => tag.toLowerCase().includes(q));
        const matchesSubject = !filters.selectedSubject || note.subject === filters.selectedSubject;
        const matchesCategory = !filters.selectedCategory || note.category === filters.selectedCategory;
        const matchesBranch = !filters.selectedBranch || note.branch === filters.selectedBranch;
        const matchesSemester =
          !filters.selectedSemester || String(note.semester) === filters.selectedSemester;
        return matchesSearch && matchesSubject && matchesCategory && matchesBranch && matchesSemester;
      });

      switch (filters.sortBy) {
        case "popular":
          filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        case "top-rated":
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "most-downloaded":
          filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
          break;
        case "oldest":
          filtered.sort(
            (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          );
          break;
        default:
          filtered.sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
      }
      return filtered;
    },
    [filters, debouncedSearchQuery]
  );

  const deleteNote = async (noteId: string) => {

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotes();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const incrementView = async (noteId: string) => {
    try {
      await fetch(`${API_URL}/${noteId}/view`, { method: 'PUT' });
      setNotes(notes.map(n => n.id === noteId ? { ...n, views: n.views + 1 } : n));
    } catch (err) {}
  };

  const incrementDownload = async (noteId: string) => {
    // Implement on backend later if needed
  };

  const totalViews = notes.reduce((sum, n) => sum + (n.views || 0), 0);
  const totalDownloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);

  const updateFilter = <K extends keyof NotesFilters>(key: K, value: NotesFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  return {
    notes,
    myNotes,
    bookmarkedNotes,
    filters,
    updateFilter,
    clearFilters,
    getFilteredNotes,
    subjects,
    categories,
    branches,
    semesters,
    totalViews,
    totalDownloads,
    loadNotes,
    deleteNote,
    incrementView,
    incrementDownload,
    loading,
    error,
    user,
  };
};
