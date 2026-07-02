import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ThumbsUp, Pin, Eye, Plus, Loader2, Lock } from "lucide-react";
import { useForumThreads, createThread, toggleThreadLike, useForumReplies, postReply, incrementThreadViews, type ForumThread } from "@/hooks/useForum";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = ["All", "General", "Web Development", "Career Advice", "Academic", "Projects", "Off Topic"];

const Forum = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<"recent" | "trending" | "unanswered">("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ForumThread | null>(null);
  const { threads, loading, status } = useForumThreads(category, tab);
  const [form, setForm] = useState({ title: "", body: "", category: "General", tagInput: "" });
  const [submitting, setSubmitting] = useState(false);

  const filtered = threads.filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    const tags = form.tagInput.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await createThread({ title: form.title.trim(), body: form.body.trim(), category: form.category, tags });
    setSubmitting(false);
    if (res) { setCreateOpen(false); setForm({ title: "", body: "", category: "General", tagInput: "" }); }
  };

  const open = (t: ForumThread) => { setSelected(t); incrementThreadViews(t.id); };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8 space-y-3">
          <Badge><MessageSquare className="mr-1 h-3 w-3" />Community Discussion</Badge>
          <h1 className="text-4xl md:text-5xl font-bold">Student Forum</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Threads, replies, likes — all live.</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Input placeholder="Search threads..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button disabled={!user}><Plus className="mr-2 h-4 w-4" />New Thread</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Start a Thread</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Title*" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
                  <Textarea placeholder="What's on your mind?*" rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={5000} />
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <Input placeholder="Tags (comma separated)" value={form.tagInput} onChange={(e) => setForm({ ...form, tagInput: e.target.value })} />
                  <Button className="w-full" onClick={submit} disabled={submitting || !form.title.trim() || !form.body.trim()}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Thread"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <SyncStatusIndicator status={status} />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {CATEGORIES.map((c) => <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>{c}</Button>)}
          </div>

          <div className="space-y-3">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No threads. Start one!</CardContent></Card>
            : filtered.map((t) => (
              <Card key={t.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => open(t)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {t.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                    {t.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <Badge variant="secondary">{t.category}</Badge>
                  </div>
                  <h3 className="text-lg font-bold">{t.title}</h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar className="h-6 w-6"><AvatarImage src={t.author?.avatar_url || ""} /><AvatarFallback>{(t.author?.full_name || "?")[0]}</AvatarFallback></Avatar>
                      <span>{t.author?.full_name || t.author?.username || "Anon"} · {formatDistanceToNow(new Date(t.last_activity_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-primary" onClick={(e) => { e.stopPropagation(); toggleThreadLike(t.id); }}>
                        <ThumbsUp className="h-4 w-4" />{t.like_count}
                      </button>
                      <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{t.reply_count}</span>
                      <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{t.view_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ThreadDialog thread={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

const ThreadDialog = ({ thread, onClose }: { thread: ForumThread | null; onClose: () => void }) => {
  const { user } = useAuth();
  const { replies, loading } = useForumReplies(thread?.id || null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  if (!thread) return null;

  const submit = async () => {
    setPosting(true);
    const r = await postReply(thread.id, body);
    setPosting(false);
    if (r) setBody("");
  };

  return (
    <Dialog open={!!thread} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <Badge variant="secondary" className="w-fit">{thread.category}</Badge>
          <DialogTitle>{thread.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-3">
          <p className="text-sm whitespace-pre-wrap mb-4">{thread.body}</p>
          <div className="border-t pt-3 space-y-3">
            <h4 className="font-semibold">{replies.length} Repl{replies.length === 1 ? "y" : "ies"}</h4>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : replies.map((r) => (
              <div key={r.id} className="border rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                <div className="text-xs text-muted-foreground mt-2">{r.author?.full_name || "Anon"} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {user && !thread.is_locked && (
          <div className="border-t pt-3 space-y-2">
            <Textarea placeholder="Reply..." value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={5000} />
            <Button onClick={submit} disabled={posting || !body.trim()} className="w-full">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Reply"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Forum;
