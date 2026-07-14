import { useState } from "react";
import { useNoteComments, SortMode } from "@/hooks/useNoteComments";
import { CommentItem } from "./CommentItem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2, ArrowUpDown } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface NoteCommentsProps {
  noteId: string;
  noteOwnerId?: string;
}

export const NoteComments = ({ noteId, noteOwnerId }: NoteCommentsProps) => {
  const {
    topLevel, getReplies, loading, submitting, sortMode, setSortMode,
    totalCount, hasMore, loadMore, addComment, editComment, deleteComment,
    vote, markHelpful, reportComment, user,
  } = useNoteComments(noteId);

  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment(newComment);
    setNewComment("");
  };

  const isNoteOwner = user?.id === noteOwnerId;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <MessageSquare className="h-4 w-4" />
          Discussion ({totalCount})
        </h3>
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="discussed">Most Discussed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New comment */}
      {user ? (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user.email?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your thoughts, ask a doubt, or help others..."
              rows={2}
              className="text-sm"
              onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="self-end"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to join the discussion.</p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : topLevel.length > 0 ? (
        <div className="space-y-1">
          {topLevel.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              isNoteOwner={isNoteOwner}
              currentUserId={user?.id}
              onVote={vote}
              onReply={(content, parentId) => addComment(content, parentId)}
              onEdit={editComment}
              onDelete={deleteComment}
              onMarkHelpful={markHelpful}
              onReport={reportComment}
              submitting={submitting}
            />
          ))}
          {hasMore && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" onClick={loadMore}>
                Load more comments
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
};
