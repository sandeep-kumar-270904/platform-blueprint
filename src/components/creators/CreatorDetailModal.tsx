import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, Video, Code, BookOpen, Eye, Heart, MessageSquare, 
  Send, CornerDownRight, Flag, MoreVertical, Loader2, Share, Link as LinkIcon
} from "lucide-react";
import { CreatorContentItem, useCrossPostToCommunity } from "@/hooks/useCreators";
import { MediaEmbedViewer, FormattedBodyRenderer } from "./CreatorMediaAndBody";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-4 w-4 mr-1.5 shrink-0" />,
  video: <Video className="h-4 w-4 mr-1.5 shrink-0" />,
  project: <Code className="h-4 w-4 mr-1.5 shrink-0" />,
  resource: <BookOpen className="h-4 w-4 mr-1.5 shrink-0" />
};

const typeColors: Record<string, string> = {
  article: "bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800",
  video: "bg-purple-500/10 text-purple-500 border-purple-200 dark:border-purple-800",
  project: "bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-800",
  resource: "bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-800"
};

interface CreatorDetailModalProps {
  item: CreatorContentItem | null;
  user: any;
  onClose: () => void;
  onCreatorClick: (authorId: string | undefined, e: React.MouseEvent) => void;
  onLike: (item: CreatorContentItem) => void;
  onCommentSubmit: (text: string) => Promise<void>;
  onReplySubmit: (commentId: string, text: string) => Promise<void>;
  onReport: (item: CreatorContentItem, commentId?: string) => void;
  commentLoading?: boolean;
  replyLoading?: boolean;
  onAnnounce?: (msg: string) => void;
}

export const CreatorDetailModal: React.FC<CreatorDetailModalProps> = ({
  item,
  user,
  onClose,
  onCreatorClick,
  onLike,
  onCommentSubmit,
  onReplySubmit,
  onReport,
  commentLoading = false,
  replyLoading = false,
  onAnnounce
}) => {
  const [commentText, setCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [visibleCommentCount, setVisibleCommentCount] = useState(5);
  const crossPostMutation = useCrossPostToCommunity();
  const navigate = useNavigate();

  useEffect(() => {
    setVisibleCommentCount(5);
    setReplyingToCommentId(null);
    setReplyText("");
    setCommentText("");
  }, [item?._id]);

  if (!item) return null;

  const isLiked = user && item.likedBy && item.likedBy.includes(user._id || user.id);
  const authorName = typeof item.userId === 'object' ? item.userId?.name : item.creatorName;
  const authorId = typeof item.userId === 'object' ? item.userId?._id : item.creatorName;
  const totalCommentsCount = item.commentsCount || (item.comments ? item.comments.length : 0);
  const isContentReported = user && item.reportedBy && item.reportedBy.includes(user._id || user.id);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleCommentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onCommentSubmit(commentText);
    setCommentText("");
    if (onAnnounce) onAnnounce("New comment posted successfully.");
  };

  const handleReplyFormSubmit = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReplySubmit(commentId, replyText);
    setReplyingToCommentId(null);
    setReplyText("");
    if (onAnnounce) onAnnounce("Reply posted successfully.");
  };

  const visibleComments = item.comments ? item.comments.slice(0, visibleCommentCount) : [];
  const remainingCommentsCount = (item.comments?.length || 0) - visibleCommentCount;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/creators?id=${item._id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  const getRelatedLink = () => {
    if (!item.relatedModule || item.relatedModule === 'none') return null;
    let base = '/dashboard';
    if (item.relatedModule === 'placement') base = '/placement';
    if (item.relatedModule === 'community') base = '/community';
    if (item.relatedModule === 'events') base = '/events';
    if (item.relatedModule === 'quiz') base = '/quizzes';
    
    if (item.relatedItemId) {
      // Adjust path if ID is provided, this is a simplified guess
      return `${base}`; 
    }
    return base;
  };

  const handleCrossPost = () => {
    if (!item) return;
    const url = `${window.location.origin}/creators?id=${item._id}`;
    crossPostMutation.mutate({
      title: item.title,
      url: url,
      description: item.description || ''
    }, {
      onSuccess: () => {
        toast.success("Successfully cross-posted to Community!");
        onClose();
        navigate('/community');
      },
      onError: () => {
        toast.error("Failed to cross-post to community.");
      }
    });
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        aria-labelledby="detail-modal-title"
        aria-describedby="detail-modal-desc"
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/80 rounded-2xl shadow-2xl bg-card"
      >
        <article role="document">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-muted/60 via-muted/30 to-background p-4 sm:p-6 md:p-8 border-b border-border/40">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <Badge variant="outline" className={`font-semibold px-3 py-1 text-xs ${typeColors[item.type] || "bg-secondary"}`}>
                {typeIcons[item.type]}
                <span className="capitalize">{item.type}</span>
              </Badge>
              
              <div className="flex items-center gap-2">
                <time dateTime={item.createdAt} className="text-xs text-muted-foreground font-medium">
                  {formatDate(item.createdAt)}
                </time>

                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={handleShare}
                  aria-label="Share this content"
                  className="h-11 w-11 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Share className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      aria-label="More options and reporting for this content piece"
                      className="h-11 w-11 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      disabled={!!isContentReported}
                      onClick={() => !isContentReported && onReport(item)}
                      className="text-destructive focus:text-destructive cursor-pointer min-h-[40px] flex items-center"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {isContentReported ? "Already Reported" : "Report Content"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <DialogTitle id="detail-modal-title" className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight pt-1 break-words">
              {item.title}
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {item.relatedModule && item.relatedModule !== 'none' && (
                  <Link to={getRelatedLink() || '#'} onClick={() => onClose()}>
                    <Badge variant="secondary" className="font-medium bg-background/60 hover:bg-background/80 transition-colors px-3 py-1.5 text-xs shadow-sm cursor-pointer inline-flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Related: {item.relatedItemLabel || item.relatedModule}</span>
                    </Badge>
                  </Link>
              )}
              {item.status === 'published' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCrossPost} 
                  disabled={crossPostMutation.isPending}
                  className="h-auto py-2 text-xs md:text-sm rounded-full bg-background/60 backdrop-blur-md px-4 min-h-[44px] md:min-h-[36px]"
                >
                  {crossPostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <MessageSquare className="h-4 w-4 mr-1.5" />}
                  Discuss in Community
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-border/40">
              <button 
                type="button"
                onClick={(e) => onCreatorClick(authorId, e)}
                className="flex items-center gap-2.5 hover:text-primary transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 -ml-1 min-h-[44px]"
                title={`View ${authorName}'s Profile`}
                aria-label={`View creator profile for ${authorName}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shadow-sm shrink-0">
                  {authorName ? authorName.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-foreground flex items-center gap-1">
                    {authorName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Community Creator</div>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-background/80 px-4 py-2 rounded-full border border-border/40 text-sm font-semibold shadow-sm min-h-[44px] md:min-h-[36px]" aria-label={`${item.views || 0} views`}>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{item.views?.toLocaleString() || 0} views</span>
                </div>

                <Button
                  type="button"
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onLike(item);
                    if (onAnnounce) onAnnounce(isLiked ? "Unliked content" : `Liked content! Total likes: ${(item.likes || 0) + 1}`);
                  }}
                  aria-label={isLiked ? `Unlike content, currently ${item.likes || 0} likes` : `Like content, currently ${item.likes || 0} likes`}
                  aria-pressed={isLiked}
                  className={`rounded-full gap-1.5 font-bold shadow-sm min-h-[44px] px-4 ${isLiked ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : "hover:text-red-500"}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  <span>{item.likes?.toLocaleString() || 0}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Body and Media */}
          <div id="detail-modal-desc" className="p-4 sm:p-6 md:p-8 space-y-6">
            {item.mediaUrl && <MediaEmbedViewer url={item.mediaUrl} title={item.title} />}

            {item.description && item.description !== item.body && (
              <div className="text-sm sm:text-base font-semibold text-muted-foreground bg-muted/20 p-4 rounded-xl border border-border/40 leading-relaxed break-words">
                {item.description}
              </div>
            )}

            <FormattedBodyRenderer text={item.body} />

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/40" aria-label="Topics and tags">
                {item.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1 text-xs bg-muted/60 text-muted-foreground font-medium rounded-full">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Discussion & Comments Section */}
            <section aria-labelledby="comments-heading" className="pt-6 border-t border-border/60 space-y-6">
              <h4 id="comments-heading" className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                <span>Discussion ({totalCommentsCount})</span>
              </h4>

              {/* Comment Submission Form */}
              <form onSubmit={handleCommentFormSubmit} className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/40">
                <Textarea
                  placeholder="Share your thoughts, ask questions, or provide feedback..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  aria-label="Write a comment"
                  className="min-h-[80px] text-sm resize-y bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={commentLoading || !commentText.trim()} 
                    className="font-bold shadow-sm min-h-[44px] px-6"
                  >
                    {commentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Post Comment
                  </Button>
                </div>
              </form>

              {/* Comment List */}
              <div className="space-y-4" role="feed" aria-label="Comment thread">
                {!item.comments || item.comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm bg-muted/10 rounded-xl border border-dashed border-border/40">
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  <>
                    {visibleComments.map((c, i) => {
                      const isCommentReported = user && c.reportedBy && c.reportedBy.includes(user._id || user.id);
                      return (
                        <article key={c._id || i} className="p-4 rounded-xl bg-card border border-border/50 space-y-2 shadow-sm" aria-labelledby={`comment-author-${c._id || i}`}>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                                {c.authorName ? c.authorName.charAt(0).toUpperCase() : "U"}
                              </div>
                              <span id={`comment-author-${c._id || i}`} className="font-bold text-foreground">{c.authorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <time dateTime={c.createdAt}>{formatDate(c.createdAt || new Date().toISOString())}</time>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button 
                                    type="button" 
                                    aria-label={`Report comment by ${c.authorName}`}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] min-w-[36px] flex items-center justify-center"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem 
                                    disabled={!!isCommentReported}
                                    onClick={() => !isCommentReported && c._id && onReport(item, c._id)}
                                    className="text-destructive focus:text-destructive cursor-pointer min-h-[40px] flex items-center"
                                  >
                                    <Flag className="h-3.5 w-3.5 mr-2" />
                                    {isCommentReported ? "Reported" : "Report Comment"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <p className="text-sm text-foreground/90 pl-8 leading-relaxed break-words whitespace-pre-wrap">{c.text}</p>
                          
                          {/* Reply Toggle & Actions */}
                          <div className="pl-8 pt-1 flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToCommentId(replyingToCommentId === (c._id || null) ? null : (c._id || null));
                                setReplyText("");
                              }}
                              aria-expanded={replyingToCommentId === c._id}
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1 min-h-[36px]"
                            >
                              <CornerDownRight className="h-3.5 w-3.5" />
                              {replyingToCommentId === c._id ? "Cancel Reply" : "Reply"}
                            </button>
                          </div>

                          {/* Inline Reply Form */}
                          {replyingToCommentId === c._id && (
                            <form onSubmit={(e) => c._id && handleReplyFormSubmit(c._id, e)} className="pl-8 pt-2 space-y-2">
                              <Textarea
                                placeholder={`Reply to ${c.authorName}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                aria-label={`Write a reply to ${c.authorName}`}
                                className="min-h-[60px] text-xs resize-y bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingToCommentId(null)}
                                  className="text-xs min-h-[36px]"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={replyLoading || !replyText.trim()}
                                  className="text-xs font-bold min-h-[36px]"
                                >
                                  {replyLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                                  Post Reply
                                </Button>
                              </div>
                            </form>
                          )}

                          {/* Nested Replies */}
                          {c.replies && c.replies.length > 0 && (
                            <div className="pl-6 sm:pl-8 pt-2 space-y-2 border-l-2 border-primary/20 ml-2" role="group" aria-label={`Replies to ${c.authorName}`}>
                              {c.replies.map((reply, rIdx) => (
                                <div key={reply._id || rIdx} className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-[10px] shrink-0">
                                        {reply.authorName ? reply.authorName.charAt(0).toUpperCase() : "U"}
                                      </div>
                                      <span className="font-bold text-foreground">{reply.authorName}</span>
                                    </div>
                                    <time dateTime={reply.createdAt}>{formatDate(reply.createdAt || new Date().toISOString())}</time>
                                  </div>
                                  <p className="text-xs text-foreground/90 pl-6.5 leading-relaxed break-words">{reply.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })}

                    {/* Pagination / Load More Button for mobile/desktop */}
                    {remainingCommentsCount > 0 && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setVisibleCommentCount(prev => prev + 5)}
                          aria-label={`Load more comments, ${remainingCommentsCount} remaining`}
                          className="w-full min-h-[44px] font-bold border-border/60 hover:bg-muted/40"
                        >
                          Load More Comments (+{remainingCommentsCount} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};
