import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useNotes } from "@/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Upload, Plus, FolderOpen, Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NoteUploadDialog } from "@/components/NoteUploadDialog";
import { NotePreviewer } from "@/components/NotePreviewer";
import { BatchUploadDialog } from "@/components/BatchUploadDialog";
import { NoteAIFeatures } from "@/components/NoteAIFeatures";
import { NoteEditDialog } from "@/components/notes/NoteEditDialog";
import { NoteDetailDialog } from "@/components/notes/NoteDetailDialog";
import { NoteCard } from "@/components/notes/NoteCard";
import { NotesStatsBar } from "@/components/notes/NotesStatsBar";
import { NotesFilterBar } from "@/components/notes/NotesFilterBar";
import { TopContributors } from "@/components/notes/TopContributors";
import { NoteSkeleton } from "@/components/notes/NoteSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";


const NotesHub = () => {
  const navigate = useNavigate();
  const {
    notes, myNotes, bookmarkedNotes, filters, updateFilter, clearFilters,
    getFilteredNotes, subjects, categories, branches, semesters,
    totalViews, totalDownloads, loadNotes, deleteNote, user, loading
  } = useNotes();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("browse");
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [filters, activeTab]);

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewNote, setPreviewNote] = useState<any>(null);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [aiNote, setAiNote] = useState<any>(null);
  const [editNote, setEditNote] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteNoteState, setDeleteNoteState] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [detailNote, setDetailNote] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [sessionName, setSessionName] = useState("");

  const filteredNotes = getFilteredNotes(notes);
  const filteredMyNotes = getFilteredNotes(myNotes);
  const filteredBookmarks = getFilteredNotes(bookmarkedNotes);

  const createStudySession = async () => {
    if (!user) { toast.error("Please sign in"); navigate("/auth"); return; }
    if (!sessionName.trim()) { toast.error("Please enter a session name"); return; }
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/study-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          note_id: selectedNote.id,
          session_name: sessionName
        })
      });

      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      
      toast.success("Study session created!"); 
      setShowSessionDialog(false); 
      setSessionName(""); 
      navigate(`/study-session/${data.id || data._id}`);
    } catch {
      toast.error("Failed to create session");
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteState) return;
    try {
      await deleteNote(deleteNoteState.id);
      toast.success("Note deleted successfully!");
      setShowDeleteDialog(false);
      setDeleteNoteState(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete note");
    }
  };

  const cardHandlers = {
    onDetail: (note: any) => { setDetailNote(note); setShowDetailDialog(true); },
    onPreview: (note: any) => { setPreviewNote(note); setShowPreviewDialog(true); },
    onAI: (note: any) => { setAiNote(note); setShowAIFeatures(true); },
    onSession: (note: any) => { setSelectedNote(note); setShowSessionDialog(true); },
    onEdit: (note: any) => { setEditNote(note); setShowEditDialog(true); },
    onDelete: (note: any) => { setDeleteNoteState(note); setShowDeleteDialog(true); },
  };

  const renderNotesList = (notesList: any[], isOwner = false) => {
    if (loading) {
      return (
        <div className={viewMode === "grid" ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
          {Array.from({ length: 8 }).map((_, i) => (
            <NoteSkeleton key={i} />
          ))}
        </div>
      );
    }

    const visibleNotes = notesList.slice(0, visibleCount);
    const hasMore = visibleCount < notesList.length;

    return (
      <>
        {notesList.length > 0 ? (
          <div className="space-y-6">
            <div className={viewMode === "grid" ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
              {visibleNotes.map((note, index) => (
                <NoteCard key={note.id} note={note} index={index} isOwner={isOwner} {...cardHandlers} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-4 pb-8">
                <Button 
                  variant="outline" 
                  className="rounded-full px-8 bg-transparent border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shadow-sm"
                  onClick={() => setVisibleCount(prev => prev + 20)}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No notes found"
            description="We couldn't find any materials matching your current filters. Try adjusting your search or be the first to upload one!"
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <div className="container mx-auto px-4 pt-12 pb-6">
        <NotesStatsBar
          totalNotes={notes.length}
          totalViews={totalViews}
          totalDownloads={totalDownloads}
          totalSubjects={subjects.length}
          isLoading={loading}
        />

        <NotesFilterBar
          filters={filters}
          onFilterChange={updateFilter}
          subjects={subjects}
          categories={categories}
          branches={branches}
          semesters={semesters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUploadClick={() => {
            if (!user) {
              toast.error("Please sign in to upload notes");
              return;
            }
            setShowUploadDialog(true);
          }}
          onBatchUploadClick={() => {
            if (!user) {
              toast.error("Please sign in to upload notes");
              return;
            }
            setShowBatchUpload(true);
          }}
        />

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1 min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                <TabsTrigger value="browse" className="data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-[var(--color-text-inverse)] text-[var(--color-text-secondary)]">
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Browse All ({filteredNotes.length})
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="my-notes" className="data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-[var(--color-text-inverse)] text-[var(--color-text-secondary)]">
                    <FolderOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />My Notes ({filteredMyNotes.length})
                  </TabsTrigger>
                )}
                {user && (
                  <TabsTrigger value="bookmarks" className="data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-[var(--color-text-inverse)] text-[var(--color-text-secondary)]">
                    <Bookmark className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Bookmarks ({filteredBookmarks.length})
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="browse" className="mt-4">
                {renderNotesList(filteredNotes)}
              </TabsContent>
              {user && (
                <TabsContent value="my-notes" className="mt-4">
                  {filteredMyNotes.length === 0 && !filters.searchQuery && !filters.selectedSubject && !filters.selectedCategory ? (
                    <EmptyState
                      icon={Upload}
                      title="You haven't uploaded any notes yet"
                      description="Share your knowledge with the community. Uploading notes helps fellow students and earns you reputation points!"
                      actionLabel="Upload Your First Note"
                      actionIcon={Upload}
                      onAction={() => setShowUploadDialog(true)}
                    />
                  ) : renderNotesList(filteredMyNotes, true)}
                </TabsContent>
              )}
              {user && (
                <TabsContent value="bookmarks" className="mt-4">
                  {filteredBookmarks.length === 0 ? (
                    <EmptyState
                      icon={Bookmark}
                      title="No bookmarked notes"
                      description="Click the bookmark icon on any note to save it for later quick access!"
                    />
                  ) : renderNotesList(filteredBookmarks)}
                </TabsContent>
              )}
            </Tabs>
          </div>
          <div className="w-full lg:w-72 shrink-0">
            <div className="sticky top-4">
              <TopContributors />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NoteUploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} onSuccess={loadNotes} />
      <NotePreviewer open={showPreviewDialog} onOpenChange={setShowPreviewDialog} note={previewNote} />
      <BatchUploadDialog open={showBatchUpload} onOpenChange={setShowBatchUpload} onSuccess={loadNotes} />
      <NoteDetailDialog open={showDetailDialog} onOpenChange={setShowDetailDialog} note={detailNote} onRefresh={loadNotes} />

      {showEditDialog && editNote && (
        <NoteEditDialog open={showEditDialog} onOpenChange={setShowEditDialog} note={editNote} onSuccess={loadNotes} />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteNoteState?.title}"? This action cannot be undone. All ratings and comments will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAIFeatures} onOpenChange={setShowAIFeatures}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{aiNote?.title} - AI Features</DialogTitle></DialogHeader>
          {aiNote && <NoteAIFeatures noteId={aiNote.id} noteTitle={aiNote.title} />}
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Study Session</DialogTitle>
            <DialogDescription>Start a collaborative study session for {selectedNote?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Session Name</label>
              <Input placeholder="e.g., Final Exam Prep" value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createStudySession}><Plus className="mr-2 h-4 w-4" />Create Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesHub;
