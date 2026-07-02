import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Send, Loader2, Sparkles } from "lucide-react";
import { useCommunityFeed, createPost, togglePostLike, usePostComments, postComment, type CommunityPost } from "@/hooks/useCommunity";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

const Community = () => {
  const { user } = useAuth();
  const { posts, loading, status } = useCommunityFeed();
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<CommunityPost | null>(null);

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    const tags = tagInput.split(",").map((s) => s.trim()).filter(Boolean);
    const r = await createPost({ content, tags });
    setPosting(false);
    if (r) { setContent(""); setTagInput(""); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="text-center mb-6 space-y-2">
          <Badge><Sparkles className="mr-1 h-3 w-3" />Community Feed</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Share with the Community</h1>
          <div className="flex justify-center"><SyncStatusIndicator status={status} /></div>
        </div>

        {user && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-3">
              <Textarea placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)} rows={3} maxLength={2000} />
              <Input placeholder="Tags (comma separated)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
              <div className="flex justify-end">
                <Button onClick={submit} disabled={posting || !content.trim()}>
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Post</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : posts.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No posts yet. {user ? "Share something!" : "Sign in to post."}</CardContent></Card>
          : posts.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarImage src={p.author?.avatar_url || ""} /><AvatarFallback>{(p.author?.full_name || "?")[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{p.author?.full_name || p.author?.username || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{p.content}</p>
                {p.tags.length > 0 && <div className="flex flex-wrap gap-1">{p.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}</div>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-2">
                  <button className="flex items-center gap-1 hover:text-primary" onClick={() => togglePostLike(p.id)}>
                    <Heart className="h-4 w-4" />{p.like_count}
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary" onClick={() => setOpenComments(p)}>
                    <MessageCircle className="h-4 w-4" />{p.comment_count}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <CommentsDialog post={openComments} onClose={() => setOpenComments(null)} />
    </div>
  );
};

const CommentsDialog = ({ post, onClose }: { post: CommunityPost | null; onClose: () => void }) => {
  const { user } = useAuth();
  const { comments, loading } = usePostComments(post?.id || null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  if (!post) return null;

  const submit = async () => {
    setPosting(true);
    const r = await postComment(post.id, text);
    setPosting(false);
    if (r) setText("");
  };

  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Comments</DialogTitle></DialogHeader>
        <ScrollArea className="flex-1 pr-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No comments yet</p>
          ) : comments.map((c) => (
            <div key={c.id} className="border-b py-2">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6"><AvatarImage src={c.author?.avatar_url || ""} /><AvatarFallback>{(c.author?.full_name || "?")[0]}</AvatarFallback></Avatar>
                <span className="text-xs font-semibold">{c.author?.full_name || "Anon"}</span>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-sm pl-8">{c.content}</p>
            </div>
          ))}
        </ScrollArea>
        {user && (
          <div className="border-t pt-2 flex gap-2">
            <Input placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
            <Button onClick={submit} disabled={posting || !text.trim()} size="sm">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Community;
