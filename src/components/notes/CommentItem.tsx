import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUp, ChevronDown, Reply, Trash2, Pencil, Flag, CheckCircle2,
  Send, X, Loader2, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/hooks/useNoteComments";

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  isNoteOwner?: boolean;
  currentUserId?: string;
  onVote: (id: string, type: "up" | "down") => void;
  onReply: (content: string, parentId: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMarkHelpful: (id: string, current: boolean) => void;
  onReport: (id: string) => void;
  submitting: boolean;
  replies?: Comment[];
}

export const CommentItem = ({
  comment, isReply = false, isNoteOwner, currentUserId,
  onVote, onReply, onEdit, onDelete, onMarkHelpful, onReport,
  submitting, replies = [],
}: CommentItemProps) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const displayName = comment.profile?.full_name || comment.profile?.username || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  const isOwner = currentUserId === comment.user_id;
  const netVotes = (comment.upvotes || 0) - (comment.downvotes || 0);

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(replyContent, comment.id);
    setReplyContent("");
    setReplyOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editContent.trim()) return;
    onEdit(comment.id, editContent);
    setEditing(false);
  };

  return (
    <div className={`group ${isReply ? "ml-8 md:ml-12" : ""}`}>
      <div className={`flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/40 ${comment.is_helpful ? "bg-primary/5 border border-primary/20 ring-1 ring-primary/10" : ""}`}>
        {/* Vote column */}
        <div className="flex flex-col items-center gap-0.5 pt-0.5">
          <button
            onClick={() => onVote(comment.id, "up")}
            className={`p-0.5 rounded transition-colors ${comment.userVote === "up" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className={`text-xs font-semibold tabular-nums ${netVotes > 0 ? "text-primary" : netVotes < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {netVotes}
          </span>
          <button
            onClick={() => onVote(comment.id, "down")}
            className={`p-0.5 rounded transition-colors ${comment.userVote === "down" ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
            {comment.is_helpful && (
              <Badge variant="default" className="text-[10px] h-4 gap-1 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Helpful
              </Badge>
            )}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEditSubmit} disabled={!editContent.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(comment.content); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words mt-1 overflow-wrap-anywhere">
              {comment.content}
            </p>
          )}

          {/* Actions row */}
          {!editing && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isReply && (
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setReplyOpen(!replyOpen)}
                >
                  <Reply className="h-3 w-3 mr-1" /> Reply
                </Button>
              )}

              {isReply && (
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setReplyOpen(!replyOpen)}
                >
                  <Reply className="h-3 w-3 mr-1" /> Reply
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={() => { setEditing(true); setEditContent(comment.content); }}>
                        <Pencil className="h-3 w-3 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive">
                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {isNoteOwner && (
                    <DropdownMenuItem onClick={() => onMarkHelpful(comment.id, comment.is_helpful)}>
                      <CheckCircle2 className="h-3 w-3 mr-2" />
                      {comment.is_helpful ? "Unmark Helpful" : "Mark Helpful"}
                    </DropdownMenuItem>
                  )}
                  {!isOwner && (
                    <DropdownMenuItem onClick={() => onReport(comment.id)}>
                      <Flag className="h-3 w-3 mr-2" /> Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Reply input */}
          {replyOpen && (
            <div className="flex gap-2 mt-2">
              <Textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={handleReplySubmit} disabled={submitting || !replyContent.trim()}>
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {replies.length > 0 && (
            <div className="mt-2 space-y-0.5 border-l-2 border-border/50">
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  isNoteOwner={isNoteOwner}
                  currentUserId={currentUserId}
                  onVote={onVote}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMarkHelpful={onMarkHelpful}
                  onReport={onReport}
                  submitting={submitting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
