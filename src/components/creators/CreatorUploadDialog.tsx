import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, Sparkles, FileText, Video, Code, BookOpen, 
  X, Tag, Eye, Edit, Loader2, AlertCircle, Link as LinkIcon, CheckCircle2
} from "lucide-react";
import { MediaEmbedViewer, FormattedBodyRenderer } from "./CreatorMediaAndBody";

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-4 w-4 mr-1.5 shrink-0" />,
  video: <Video className="h-4 w-4 mr-1.5 shrink-0" />,
  project: <Code className="h-4 w-4 mr-1.5 shrink-0" />,
  resource: <BookOpen className="h-4 w-4 mr-1.5 shrink-0" />
};

interface CreatorUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'edit' | 'preview';
  onModeChange: (val: 'edit' | 'preview') => void;
  isEditing: boolean;
  title: string;
  onTitleChange: (val: string) => void;
  type: 'article' | 'video' | 'project' | 'resource';
  onTypeChange: (val: 'article' | 'video' | 'project' | 'resource') => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  body: string;
  onBodyChange: (val: string) => void;
  thumbnail: string;
  onThumbnailChange: (val: string) => void;
  mediaUrl: string;
  onMediaUrlChange: (val: string) => void;
  tags: string[];
  onTagsChange: (val: string[]) => void;
  relatedModule?: string;
  onRelatedModuleChange?: (val: string) => void;
  relatedItemId?: string;
  onRelatedItemIdChange?: (val: string) => void;
  relatedItemLabel?: string;
  onRelatedItemLabelChange?: (val: string) => void;
  reviewers?: string[];
  onReviewersChange?: (val: string[]) => void;
  popularTags?: string[];
  errors: { title?: string; body?: string };
  isSubmitting: boolean;
  isAutoSaving?: boolean;
  lastSavedAt?: Date | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const CreatorUploadDialog: React.FC<CreatorUploadDialogProps> = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
  isEditing,
  title,
  onTitleChange,
  type,
  onTypeChange,
  description,
  onDescriptionChange,
  body,
  onBodyChange,
  thumbnail,
  onThumbnailChange,
  mediaUrl,
  onMediaUrlChange,
  tags,
  onTagsChange,
  relatedModule = 'none',
  onRelatedModuleChange,
  relatedItemId = '',
  onRelatedItemIdChange,
  relatedItemLabel = '',
  onRelatedItemLabelChange,
  reviewers = [],
  onReviewersChange,
  popularTags,
  errors,
  isSubmitting,
  isAutoSaving,
  lastSavedAt,
  onSubmit
}) => {
  const [tagInput, setTagInput] = useState("");
  const [reviewerInput, setReviewerInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        onTagsChange([...tags, clean]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  const handleAddReviewer = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = reviewerInput.trim();
      if (clean && !reviewers.includes(clean)) {
        onReviewersChange?.([...reviewers, clean]);
        setReviewerInput("");
      }
    } else if (e.key === "Backspace" && !reviewerInput && reviewers.length > 0) {
      onReviewersChange?.(reviewers.slice(0, -1));
    }
  };

  const removeReviewer = (reviewerToRemove: string) => {
    onReviewersChange?.(reviewers.filter(r => r !== reviewerToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        aria-labelledby="upload-modal-title"
        aria-describedby="upload-modal-desc"
        className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8"
      >
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <DialogTitle id="upload-modal-title" className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary shrink-0" />
            <span>{isEditing ? "Edit Creator Content" : "Upload New Content"}</span>
          </DialogTitle>

          {/* Edit vs Live Preview Mode Toggle */}
          <div role="tablist" aria-label="Upload view mode" className="flex items-center bg-muted/60 p-1 rounded-full border border-border/40 self-start sm:self-auto">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "edit"}
              onClick={() => onModeChange("edit")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                mode === "edit" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Form</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "preview"}
              onClick={() => onModeChange("preview")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                mode === "preview" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Live Preview</span>
            </button>
          </div>
        </DialogHeader>

        <div id="upload-modal-desc" className="py-2">
          {mode === "preview" ? (
            /* Live Preview Area */
            <div className="space-y-6 border border-border/60 rounded-2xl p-4 sm:p-6 bg-card/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold px-2.5 py-1 text-xs">
                  {typeIcons[type]}
                  <span className="capitalize">{type}</span>
                </Badge>
                <span className="text-2xl select-none" aria-hidden="true">{thumbnail || "✨"}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold break-words">
                {title || "Untitled Content Preview"}
              </h2>

              {mediaUrl && <MediaEmbedViewer url={mediaUrl} title={title} />}

              {description && description !== body && (
                <div className="text-sm font-semibold text-muted-foreground bg-muted/20 p-4 rounded-xl border border-border/40 break-words">
                  {description}
                </div>
              )}

              <FormattedBodyRenderer text={body || "No content body written yet..."} />

              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/40">
                  {tags.map((t, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 text-xs rounded-full">
                      #{t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Edit Form Area */
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Content Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground block">
                  Content Type <span className="text-destructive">*</span>
                </label>
                <div role="tablist" aria-label="Select content type" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'article', label: 'Article', icon: <FileText className="h-4 w-4" /> },
                    { id: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
                    { id: 'project', label: 'Project', icon: <Code className="h-4 w-4" /> },
                    { id: 'resource', label: 'Resource', icon: <BookOpen className="h-4 w-4" /> }
                  ].map((t) => (
                    <button
                      type="button"
                      role="tab"
                      key={t.id}
                      aria-selected={type === t.id}
                      onClick={() => onTypeChange(t.id as any)}
                      className={`p-3 rounded-xl border font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        type === t.id
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label htmlFor="content-title" className="text-sm font-bold text-foreground block">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="content-title"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "title-error" : undefined}
                  placeholder="e.g. Complete Guide to Dynamic Programming in 2026"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className={`h-11 text-sm bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] ${errors.title ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.title && (
                  <p id="title-error" role="alert" className="text-xs font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Thumbnail Emoji and Media Embed URL */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label htmlFor="thumbnail-emoji" className="text-sm font-bold text-foreground block">
                    Emoji Icon
                  </label>
                  <Input
                    id="thumbnail-emoji"
                    placeholder="✨"
                    maxLength={4}
                    value={thumbnail}
                    onChange={(e) => onThumbnailChange(e.target.value)}
                    className="h-11 text-center text-lg bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label htmlFor="media-url" className="text-sm font-bold text-foreground block">
                    Media Attachment URL <span className="text-xs font-normal text-muted-foreground">(YouTube, Vimeo, or Image)</span>
                  </label>
                  <Input
                    id="media-url"
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://..."
                    value={mediaUrl}
                    onChange={(e) => onMediaUrlChange(e.target.value)}
                    className="h-11 text-sm bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
                  />
                </div>
              </div>

              {/* Short Summary Description */}
              <div className="space-y-1.5">
                <label htmlFor="content-description" className="text-sm font-bold text-foreground block">
                  Short Summary / Subtitle
                </label>
                <Input
                  id="content-description"
                  placeholder="A brief 1-2 sentence overview shown on content cards..."
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="h-11 text-sm bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
                />
              </div>

              {/* Complete Body / Content */}
              <div className="space-y-1.5">
                <label htmlFor="content-body" className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>Complete Body / Tutorial Text <span className="text-destructive">*</span></span>
                  <span className="text-xs font-normal text-muted-foreground">Tip: Wrap code blocks with ```javascript ... ```</span>
                </label>
                <Textarea
                  id="content-body"
                  aria-invalid={!!errors.body}
                  aria-describedby={errors.body ? "body-error" : undefined}
                  placeholder="Write your complete guide, project documentation, or resource notes here..."
                  value={body}
                  onChange={(e) => onBodyChange(e.target.value)}
                  className={`min-h-[180px] text-sm resize-y bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary font-normal ${errors.body ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.body && (
                  <p id="body-error" role="alert" className="text-xs font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.body}
                  </p>
                )}
              </div>

              {/* Accessible Tags Input */}
              <div className="space-y-2">
                <label htmlFor="tags-input" className="text-sm font-bold text-foreground block">
                  Topics / Tags <span className="text-xs font-normal text-muted-foreground">(Type a tag and press Enter or Comma)</span>
                </label>
                
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border/60 bg-background min-h-[48px] focus-within:ring-2 focus-within:ring-primary">
                  {tags.map((t, idx) => (
                    <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-1 max-w-full">
                      <span className="truncate">#{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); removeTag(t); } }}
                        aria-label={`Remove tag ${t}`}
                        className="rounded-full hover:bg-primary/20 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center -mr-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Badge>
                  ))}

                  <input
                    id="tags-input"
                    type="text"
                    placeholder={tags.length === 0 ? "e.g. DSA, React, Career (press Enter)" : "Add another tag..."}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-[140px] h-8 px-1"
                  />
                </div>

                {popularTags && popularTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">Popular:</span>
                    {popularTags.map(tag => {
                      const isSelected = tags.map(t => t.toLowerCase()).includes(tag.toLowerCase());
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              onTagsChange(tags.filter(t => t.toLowerCase() !== tag.toLowerCase()));
                            } else {
                              onTagsChange([...tags, tag]);
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all min-h-[44px] md:min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected 
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm" 
                              : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {isSelected ? `✓ #${tag}` : `+ #${tag}`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Advanced: Link Related Content */}
              <div className="space-y-2 border border-border/40 rounded-xl p-4 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  aria-expanded={showAdvanced}
                >
                  <span className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    Advanced: Link Related Content
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {showAdvanced ? "Hide" : "Expand"}
                  </span>
                </button>
                
                {showAdvanced && (
                  <div className="pt-3 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="related-module" className="text-xs font-semibold text-foreground">Module</label>
                        <select
                          id="related-module"
                          value={relatedModule}
                          onChange={(e) => onRelatedModuleChange?.(e.target.value)}
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
                        >
                          <option value="none">None</option>
                          <option value="placement">Placement Prep</option>
                          <option value="community">Community Forum</option>
                          <option value="events">Events</option>
                          <option value="quiz">Quizzes</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="related-label" className="text-xs font-semibold text-foreground">Link Text (Optional)</label>
                        <Input
                          id="related-label"
                          placeholder="e.g. My Google Interview"
                          value={relatedItemLabel}
                          onChange={(e) => onRelatedItemLabelChange?.(e.target.value)}
                          disabled={relatedModule === 'none'}
                          className="h-11 text-sm bg-background border-border/60 min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="related-id" className="text-xs font-semibold text-foreground">Target ID or URL (Optional)</label>
                      <Input
                        id="related-id"
                        placeholder="e.g. /placement/interview-prep/123"
                        value={relatedItemId}
                        onChange={(e) => onRelatedItemIdChange?.(e.target.value)}
                        disabled={relatedModule === 'none'}
                        className="h-11 text-sm bg-background border-border/60 min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <label htmlFor="reviewers-input" className="text-xs font-semibold text-foreground block">
                        Request Feedback (Reviewers) <span className="text-muted-foreground font-normal">(Type username and press Enter)</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border/60 bg-background min-h-[48px] focus-within:ring-2 focus-within:ring-primary">
                        {reviewers.map((r, idx) => (
                          <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-full flex items-center gap-1 max-w-full">
                            <span className="truncate">@{r}</span>
                            <button
                              type="button"
                              onClick={() => removeReviewer(r)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); removeReviewer(r); } }}
                              aria-label={`Remove reviewer ${r}`}
                              className="rounded-full hover:bg-purple-500/20 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center -mr-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Badge>
                        ))}
                        <input
                          id="reviewers-input"
                          type="text"
                          placeholder={reviewers.length === 0 ? "e.g. johndoe (press Enter)" : "Add reviewer..."}
                          value={reviewerInput}
                          onChange={(e) => setReviewerInput(e.target.value)}
                          onKeyDown={handleAddReviewer}
                          className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-[140px] h-8 px-1"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Adding reviewers sets your post status to "In Review". Only reviewers can see and comment on it.</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/40 sm:items-center">
                <div className="flex-1 flex items-center justify-start text-xs font-medium text-muted-foreground">
                  {isAutoSaving ? (
                    <span className="flex items-center gap-1.5 text-primary">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving draft...
                    </span>
                  ) : lastSavedAt ? (
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Draft saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : null}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={isSubmitting} 
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full sm:w-auto font-bold min-h-[44px] px-6"
                  >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {isEditing ? "Save Changes" : "Publish Content"}
                    </>
                  )}
                </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
