import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Users, Share2, Bookmark, Flag, CheckCircle, XCircle, Star, Trash2, 
  Clock, ExternalLink, MessageSquare, Sparkles, AlertCircle, ShieldCheck,
  Send, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { 
  trackArticleView, toggleBookmark, reportArticle, useComments, 
  submitComment, voteComment 
} from "@/hooks/useNews";
import { CollectionsModal } from "./CollectionsModal";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800";

const CommentsSection = ({ articleId }: { articleId: string }) => {
  const { comments, loading, fetchComments } = useComments(articleId);
  const [newComment, setNewComment] = useState('');
  
  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      await submitComment(articleId, newComment);
      setNewComment('');
      fetchComments();
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error('Error posting comment: ' + err.message);
    }
  };

  const handleVote = async (id: string, action: 'upvote'|'downvote') => {
    try {
      await voteComment(id, action);
      fetchComments();
    } catch (err: any) {
      toast.error('Error voting: ' + err.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground text-sm">Loading comments...</div>;

  return (
    <div className="p-4 bg-muted/30 border-t border-border mt-4 rounded-b-xl animate-in slide-in-from-top-2">
      <h4 className="font-semibold text-sm mb-4">Discussion</h4>
      <div className="flex gap-2 mb-6">
        <Input 
          placeholder="Share your thoughts..." 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)}
          className="bg-background"
        />
        <Button size="sm" onClick={handlePost}><Send className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-4">
        {comments.map((c: any) => (
          <div key={c._id} className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{c.userId?.username || 'User'}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mb-2 text-foreground/90">{c.text}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => handleVote(c._id, 'upvote')} className="hover:text-primary">▲ {c.upvotes}</button>
              <button onClick={() => handleVote(c._id, 'downvote')} className="hover:text-destructive">▼ {c.downvotes}</button>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-xs text-muted-foreground text-center">No comments yet. Start the conversation!</p>}
      </div>
    </div>
  );
};


export function ArticleCard({ article, isAdminMode, savedIds, toggleLocalSavedId, onAdminAction }: any) {
  const isSaved = savedIds.has(article._id);
  const [showComments, setShowComments] = useState(false);
  
  // Reporting state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reporting, setReporting] = useState(false);
  
  // Collections state
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  const handleReport = async () => {
    setReporting(true);
    try {
      await reportArticle(article._id, reportReason);
      toast.success("Article reported successfully");
      setReportOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to report article");
    } finally {
      setReporting(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(article.sourceLink);
    toast.success("Link copied to clipboard!");
  };

  const handleSimpleBookmark = async () => {
    try {
      toggleLocalSavedId(article._id, !isSaved);
      await toggleBookmark(article._id);
      toast.success(!isSaved ? "Saved to bookmarks" : "Removed from bookmarks");
    } catch (err: any) {
      toggleLocalSavedId(article._id, isSaved); 
      toast.error(err.message || "Failed to toggle bookmark");
    }
  };

  // Determine which summary to show based on user locale.
  // In a real app we'd access `user.locale`, assuming 'en' for now but falling back to translation map if it exists.
  const aiSummaryText = article.aiSummary || (article.aiSummaryTranslations && article.aiSummaryTranslations['en']);

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border-border ${article.isFeatured ? 'ring-2 ring-black' : ''} ${article.isNew ? 'animate-in fade-in slide-in-from-top-4 duration-500' : ''}`}>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
          <img 
            src={article.imageUrl || DEFAULT_IMAGE} 
            alt={article.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          {article.isFeatured && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center">
              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
            </div>
          )}
          {article.versions && article.versions.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-blue-600/90 backdrop-blur text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded flex items-center group/version cursor-help">
              <AlertCircle className="h-3 w-3 mr-1" /> Updated
              <div className="absolute hidden group-hover/version:block bottom-full left-0 mb-1 w-48 bg-black text-white p-2 rounded text-[10px] normal-case shadow-xl">
                {article.versions[article.versions.length - 1].changes}
              </div>
            </div>
          )}
        </div>
        
        <div className="md:w-2/3 flex flex-col p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2 items-center flex-wrap">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold">
                {article.category}
              </Badge>
              {article.tags?.slice(0, 2).map((t: string) => (
                <Badge key={t} variant="outline" className="text-xs text-foreground/50 border-border">{t}</Badge>
              ))}
              
              {article.submissionType === 'user_submitted' && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  <Users className="h-3 w-3 mr-1" /> Community
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <button onClick={handleShare} className="text-foreground/40 hover:text-foreground transition-colors p-1" title="Copy Link">
                <Share2 className="h-4 w-4" />
              </button>
              <button onClick={() => setCollectionsOpen(true)} className="text-foreground/40 hover:text-primary transition-colors p-1" title="Save to Collection">
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
              </button>
              
              <CollectionsModal 
                open={collectionsOpen} 
                onOpenChange={setCollectionsOpen} 
                articleId={article._id} 
                isSaved={isSaved}
                onSimpleBookmark={handleSimpleBookmark}
              />

              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <button className="text-foreground/40 hover:text-destructive transition-colors p-1" title="Report Article">
                    <Flag className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Article</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">Why are you reporting this article?</p>
                    <Select value={reportReason} onValueChange={setReportReason}>
                      <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="broken_link">Broken Link</SelectItem>
                        <SelectItem value="misleading">Misleading/Fake News</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReport} disabled={reporting}>
                      {reporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Report
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <a href={article.sourceLink} target="_blank" rel="noopener noreferrer" onClick={() => trackArticleView(article._id)}>
            <h3 className="text-xl md:text-2xl font-bold font-serif leading-tight mb-3 hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            
            {aiSummaryText && (
              <div className="mb-4 p-3 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1.5 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> AI Summary
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {aiSummaryText}
                </p>
              </div>
            )}
            
            {!aiSummaryText && (
              <p className="text-foreground/60 line-clamp-2 mb-6 flex-1 text-sm md:text-base">
                {article.summary}
              </p>
            )}
          </a>
          
          <div className="flex flex-wrap items-center justify-between mt-auto pt-4 border-t border-border gap-y-2">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground/50">
              <span className="text-foreground/80 font-bold flex items-center">
                {article.sourceCredibility && <ShieldCheck className="h-4 w-4 mr-1 text-green-600" title={article.sourceCredibility} />}
                {article.sourceName}
              </span>
              <span>•</span>
              <span className="flex items-center" title="Published">
                <Clock className="h-3 w-3 mr-1 opacity-70" />
                {formatDistanceToNow(new Date(article.publishedAt))} ago
              </span>
              {article.readingTime && (
                <>
                  <span>•</span>
                  <span>{article.readingTime} min read</span>
                </>
              )}
            </div>
            
            <div className="flex gap-4 items-center">
              <button onClick={() => setShowComments(!showComments)} className="text-sm text-foreground/60 hover:text-foreground font-semibold flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" /> Discuss
              </button>
              <a href={article.sourceLink} target="_blank" rel="noopener noreferrer" onClick={() => trackArticleView(article._id)} className="text-primary font-semibold text-sm hover:underline flex items-center">
                Read <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>

          {isAdminMode && (
            <div className="mt-4 pt-4 border-t border-dashed flex gap-2 w-full">
              {article.status !== 'live' && (
                <Button size="sm" variant="default" className="flex-1 bg-green-600 hover:bg-green-700" onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'status', 'live'); }}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
              )}
              {article.status !== 'rejected' && (
                <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'status', 'rejected'); }}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              )}
              <Button size="sm" variant={article.isFeatured ? "default" : "outline"} onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'feature', !article.isFeatured); }}>
                <Star className={`h-4 w-4 ${article.isFeatured ? 'fill-current' : ''}`} />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); onAdminAction(article._id, 'delete'); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {showComments && <CommentsSection articleId={article._id} />}
    </Card>
  );
}
