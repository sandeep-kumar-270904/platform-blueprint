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
  const [stats, setStats] = useState({ totalNotes: 0, totalViews: 0, totalDownloads: 0, totalSubjects: 0 });
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
      const token = localStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [notesRes, statsRes, bookmarksRes] = await Promise.allSettled([
        fetch(API_URL),
        fetch(`${API_URL}/summary`),
        token ? fetch(`${API_URL}/bookmarks`, { headers }) : Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as any)
      ]);

      if (notesRes.status === "fulfilled" && notesRes.value.ok) {
        const data = await notesRes.value.json();
        setNotes(data.map((n: any) => ({ id: n._id, ...n })));
      } else {
        throw new Error("Failed to load notes");
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        setStats(statsData);
      }

      if (bookmarksRes.status === "fulfilled" && bookmarksRes.value.ok) {
        const bookmarksData = await bookmarksRes.value.json();
        setBookmarkedNoteIds(new Set(bookmarksData));
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
    // Optimistic UI update
    setNotes(current => current.filter(n => n.id !== noteId));
    setStats(prev => ({ ...prev, totalNotes: Math.max(0, prev.totalNotes - 1) }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      console.error("Delete failed", err);
      // Revert optimistic update by reloading
      loadNotes();
      throw err;
    }
  };

  const addNoteOptimistic = (newNote: any) => {
    const mappedNote = { id: newNote._id || newNote.id || Date.now().toString(), ...newNote, user_id: user?.id, views: 0, downloads: 0 };
    setNotes(current => [mappedNote, ...current]);
    setStats(prev => ({ ...prev, totalNotes: prev.totalNotes + 1 }));
  };

  const incrementView = async (noteId: string) => {
    const sessionKey = `viewed_note_${noteId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    try {
      await fetch(`${API_URL}/${noteId}/view`, { method: 'PUT' });
      sessionStorage.setItem(sessionKey, 'true');
      setNotes(notes.map(n => n.id === noteId ? { ...n, views: (n.views || 0) + 1 } : n));
      setStats(prev => ({ ...prev, totalViews: prev.totalViews + 1 }));
    } catch (err) {}
  };

  const incrementDownload = async (noteId: string) => {
    try {
      await fetch(`${API_URL}/${noteId}/download`, { method: 'PUT' });
      setNotes(notes.map(n => n.id === noteId ? { ...n, downloads: (n.downloads || 0) + 1 } : n));
      setStats(prev => ({ ...prev, totalDownloads: prev.totalDownloads + 1 }));
    } catch (err) {}
  };

  const toggleBookmark = async (noteId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Optimistic update
    setBookmarkedNoteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) newSet.delete(noteId);
      else newSet.add(noteId);
      return newSet;
    });

    try {
      const res = await fetch(`${API_URL}/${noteId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Bookmark failed");
      const data = await res.json();
      setBookmarkedNoteIds(new Set(data.bookmarked_notes));
    } catch (err) {
      // Revert optimistic update
      console.error("Bookmark failed", err);
      loadNotes();
    }
  };

  const rateNote = async (noteId: string, score: number, review?: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_URL}/${noteId}/rate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, review })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Rating failed");
    }
    
    const updatedNote = await res.json();
    setNotes(notes.map(n => n.id === noteId ? { ...n, rating: updatedNote.rating, rating_count: updatedNote.rating_count } : n));
  };

  const addComment = async (noteId: string, content: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_URL}/${noteId}/comments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    
    if (!res.ok) throw new Error("Comment failed");
    
    const newComment = await res.json();
    setNotes(notes.map(n => n.id === noteId ? { ...n, comment_count: (n.comment_count || 0) + 1 } : n));
    return newComment;
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
    bookmarkedNoteIds,
    filters,
    updateFilter,
    clearFilters,
    getFilteredNotes,
    subjects,
    categories,
    branches,
    semesters,
    stats,
    loadNotes,
    deleteNote,
    addNoteOptimistic,
    incrementView,
    incrementDownload,
    toggleBookmark,
    rateNote,
    addComment,
    loading,
    error,
    user,
  };
};
