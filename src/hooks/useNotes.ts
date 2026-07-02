import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { mockNotes } from "@/lib/mockData";

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

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [bookmarkedNoteIds, setBookmarkedNoteIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<NotesFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setNotes([...data, ...mockNotes as any[]]);
    } else {
      setNotes(mockNotes as any[]);
    }
    setLoading(false);
  }, []);

  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("note_bookmarks")
      .select("note_id")
      .eq("user_id", user.id);
    if (data) setBookmarkedNoteIds(new Set(data.map((b) => b.note_id)));
  }, [user]);

  useEffect(() => {
    loadNotes();
    loadBookmarks();

    const channel = supabase
      .channel("notes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => {
        loadNotes();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "note_bookmarks" }, () => {
        loadBookmarks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotes, loadBookmarks]);

  const myNotes = user ? notes.filter((n) => n.user_id === user.id) : [];
  const bookmarkedNotes = notes.filter((n) => bookmarkedNoteIds.has(n.id));

  const subjects = Array.from(new Set(notes.map((n) => n.subject)));
  const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));
  const branches = Array.from(new Set(notes.map((n) => n.branch).filter(Boolean)));
  const semesters = Array.from(new Set(notes.map((n) => n.semester).filter(Boolean))).sort(
    (a, b) => Number(a) - Number(b)
  );

  const getFilteredNotes = useCallback(
    (notesList: any[]) => {
      const q = filters.searchQuery.toLowerCase();
      let filtered = notesList.filter((note) => {
        const matchesSearch =
          !q ||
          note.title.toLowerCase().includes(q) ||
          note.subject.toLowerCase().includes(q) ||
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
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          break;
        default:
          filtered.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
      return filtered;
    },
    [filters]
  );

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) throw error;
    loadNotes();
  };

  const incrementView = async (noteId: string) => {
    await supabase.rpc("increment_note_views" as any, { _note_id: noteId });
  };

  const incrementDownload = async (noteId: string) => {
    await supabase.rpc("increment_note_downloads" as any, { _note_id: noteId });
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
    user,
  };
};
