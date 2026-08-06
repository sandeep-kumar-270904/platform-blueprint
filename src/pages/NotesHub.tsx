import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useNotes } from "@/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Upload, Plus, FolderOpen, Bookmark, Search
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
    stats, loadNotes, deleteNote, addNoteOptimistic, user, loading
  } = useNotes();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("browse");
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [filters, activeTab]);

  useEffect(() => {
    document.title = "Notes — StudentHub";
  }, []);

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
              {/* Add Note Tile */}
              {user && (
                <div 
                  onClick={() => setShowUploadDialog(true)}
                  className={`flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md active:scale-[0.99] group dark:bg-white/[0.01] dark:border-white/10 dark:hover:border-primary/50 dark:hover:bg-white/[0.03] ${viewMode === "list" ? "h-[80px] min-h-0" : "h-full min-h-[260px]"}`}
                >
                  <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                  <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors">Add Note</span>
                </div>
              )}
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
            actionLabel={filters.searchQuery || filters.selectedSubject || filters.selectedCategory ? "Clear Filters" : "Upload your first note"}
            actionIcon={filters.searchQuery || filters.selectedSubject || filters.selectedCategory ? undefined : Upload}
            onAction={filters.searchQuery || filters.selectedSubject || filters.selectedCategory ? clearFilters : () => setShowUploadDialog(true)}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-6 pb-8 space-y-6">
        
        {/* Page Header */}
        <div className="pb-4">
          <nav className="flex text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li><span className="hover:text-foreground transition-colors cursor-pointer" onClick={() => navigate("/dashboard")}>Dashboard</span></li>
              <li><span className="text-muted-foreground/40">/</span></li>
              <li><span>Learning & Skills</span></li>
              <li><span className="text-muted-foreground/40">/</span></li>
              <li className="text-foreground font-medium" aria-current="page">Notes</li>
            </ol>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Notes</h1>
              <p className="text-muted-foreground mt-1.5">
                Browse, upload, and collaborate on study materials shared by the community.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-[260px] shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search notes..."
                  className="pl-9 h-10 w-full border-border focus-visible:ring-primary rounded-lg bg-background"
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter("searchQuery", e.target.value)}
                />
              </div>

              <Button
                onClick={() => {
                  if (!user) {
                    toast.error("Please sign in to upload notes");
                    return;
                  }
                  setShowUploadDialog(true);
                }}
                className="shrink-0 h-10 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg hover:-translate-y-[1px] transition-all active:scale-[0.97] shadow-sm"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Note
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 xl:items-start justify-between">
          <div className="shrink-0">
            <NotesStatsBar
              totalNotes={stats.totalNotes}
              totalViews={stats.totalViews}
              totalDownloads={stats.totalDownloads}
              totalSubjects={stats.totalSubjects}
              isLoading={loading}
            />
          </div>

          <div className="flex-1 min-w-0 w-full xl:w-auto xl:flex xl:justify-end">
            <NotesFilterBar
              filters={filters}
              onFilterChange={updateFilter}
              subjects={subjects}
              categories={categories}
              branches={branches}
              semesters={semesters}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onBatchUploadClick={() => {
                if (!user) {
                  toast.error("Please sign in to upload notes");
                  return;
                }
                setShowBatchUpload(true);
              }}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <div className="flex-1 min-w-0 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-full justify-start space-x-6 overflow-x-auto overflow-y-hidden hide-scrollbar">
                <TabsTrigger 
                  value="browse" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 data-[state=active]:text-primary text-muted-foreground transition-all hover:text-foreground group"
                >
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="font-semibold">Browse All</span>
                  <span className="ml-2 text-xs font-normal text-muted-foreground group-data-[state=active]:text-primary/70">({filteredNotes.length})</span>
                </TabsTrigger>
                {user && (
                  <TabsTrigger 
                    value="my-notes" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 data-[state=active]:text-primary text-muted-foreground transition-all hover:text-foreground group"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span className="font-semibold">My Notes</span>
                    <span className="ml-2 text-xs font-normal text-muted-foreground group-data-[state=active]:text-primary/70">({filteredMyNotes.length})</span>
                  </TabsTrigger>
                )}
                {user && (
                  <TabsTrigger 
                    value="bookmarks" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 data-[state=active]:text-primary text-muted-foreground transition-all hover:text-foreground group"
                  >
                    <Bookmark className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span className="font-semibold">Bookmarks</span>
                    <span className="ml-2 text-xs font-normal text-muted-foreground group-data-[state=active]:text-primary/70">({filteredBookmarks.length})</span>
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="browse" className="mt-6">
                {renderNotesList(filteredNotes)}
              </TabsContent>
              {user && (
                <TabsContent value="my-notes" className="mt-6">
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
                <TabsContent value="bookmarks" className="mt-6">
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
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-6">
              <TopContributors />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NoteUploadDialog 
        open={showUploadDialog} 
        onOpenChange={setShowUploadDialog} 
        onSuccess={(newNote) => {
          addNoteOptimistic(newNote);
          loadNotes();
        }} 
      />
      <NotePreviewer open={showPreviewDialog} onOpenChange={setShowPreviewDialog} note={previewNote} />
      <BatchUploadDialog 
        open={showBatchUpload} 
        onOpenChange={setShowBatchUpload} 
        onSuccess={() => loadNotes()} 
      />
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
