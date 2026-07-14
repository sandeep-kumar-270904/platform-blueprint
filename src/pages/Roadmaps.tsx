import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useSyncStatusToast } from "@/hooks/useSyncStatusToast";
import {
  useRoadmaps, useCheatSheets, fetchSteps, createRoadmap, toggleStep, downloadCheatSheet,
  type Roadmap, type RoadmapStep,
} from "@/hooks/useRoadmaps";
import { useAuth } from "@/hooks/useAuth";
import { Map, Download, BookOpen, CheckCircle2, Plus, Loader2, Circle } from "lucide-react";
import { toast } from "sonner";

const Roadmaps = () => {
  const { user } = useAuth();
  const { roadmaps, loading, status, completedSteps, refetch } = useRoadmaps();
  const { sheets, loading: sheetsLoading, status: sheetsStatus } = useCheatSheets();
  useSyncStatusToast(status, "Roadmaps");

  const [tab, setTab] = useState("roadmaps");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [openRoadmap, setOpenRoadmap] = useState<Roadmap | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);

  useEffect(() => {
    if (openRoadmap) fetchSteps(openRoadmap.id).then(setSteps);
  }, [openRoadmap]);

  const filtered = roadmaps.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase())
  );

  const onToggle = async (rmId: string, stepId: string) => {
    try { await toggleStep(rmId, stepId); refetch(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          
          <div className="container mx-auto px-4 relative z-8">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <div className="flex justify-center mb-4"><SyncStatusIndicator status={status} /></div>
                <Badge variant="default" className="mb-6"><Map className="mr-1 h-3 w-3" />Learning Paths</Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Roadmaps &{" "}
                  <span className="text-foreground display-font">Cheat Sheets</span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Follow structured learning paths and grab quick reference guides. Track your progress live.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={tab} onValueChange={setTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="roadmaps">Roadmaps</TabsTrigger>
            <TabsTrigger value="cheatsheets">Cheat Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="roadmaps" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto">
              <Input placeholder="Search roadmaps..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {user && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create</Button></DialogTrigger>
                  <CreateRoadmapDialog onClose={() => setCreateOpen(false)} />
                </Dialog>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No roadmaps yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filtered.map((rm, i) => {
                  const completedCount = 0; // approximated below from completedSteps when opened
                  return (
                    <ScrollReveal key={rm.id} delay={Math.min(0.05 * i, 0.3)}>
                      <Card className="hover-lift h-full">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="secondary">{rm.category}</Badge>
                            <Badge variant="outline">{rm.difficulty}</Badge>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{rm.title}</h3>
                          {rm.description && <p className="text-sm text-muted-foreground line-clamp-2">{rm.description}</p>}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Steps</span>
                              <span className="font-medium">{rm.step_count}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {rm.topics.slice(0, 4).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                            </div>
                            <Button className="w-full" size="sm" onClick={() => setOpenRoadmap(rm)}>
                              <BookOpen className="mr-2 h-4 w-4" />View Path
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cheatsheets" className="space-y-6">
            <div className="flex justify-end max-w-6xl mx-auto"><SyncStatusIndicator status={sheetsStatus} /></div>
            {sheetsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : sheets.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No cheat sheets yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {sheets.map((s, i) => (
                  <ScrollReveal key={s.id} delay={Math.min(0.05 * i, 0.3)}>
                    <Card className="hover-lift">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary">{s.category}</Badge>
                          <Badge variant="outline">{s.format}</Badge>
                        </div>
                        <h3 className="text-lg font-bold">{s.title}</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span>{s.pages} pages</span><span>{s.downloads} downloads</span>
                        </div>
                        <Button className="w-full" size="sm" onClick={() => downloadCheatSheet(s.id, s.file_url)} disabled={!s.file_url}>
                          <Download className="mr-2 h-4 w-4" />Download
                        </Button>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {openRoadmap && (
        <Dialog open onOpenChange={() => setOpenRoadmap(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{openRoadmap.title}</DialogTitle></DialogHeader>
            <Progress value={steps.length ? (steps.filter((s) => completedSteps.has(s.id)).length / steps.length) * 100 : 0} />
            <p className="text-sm text-muted-foreground">
              {steps.filter((s) => completedSteps.has(s.id)).length} of {steps.length} complete
            </p>
            <div className="space-y-2">
              {steps.map((s, i) => {
                const done = completedSteps.has(s.id);
                return (
                  <Card key={s.id} className={`p-4 cursor-pointer transition ${done ? "bg-primary/5 border-primary/40" : ""}`} onClick={() => user && onToggle(openRoadmap.id, s.id)}>
                    <div className="flex items-start gap-3">
                      {done ? <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <h4 className={`font-semibold ${done ? "line-through text-muted-foreground" : ""}`}>{i + 1}. {s.title}</h4>
                        {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const CreateRoadmapDialog = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [duration, setDuration] = useState("");
  const [topics, setTopics] = useState("");
  const [steps, setSteps] = useState<{ title: string; description?: string }[]>([{ title: "" }]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return toast.error("Title required");
    const valid = steps.filter((s) => s.title.trim());
    if (!valid.length) return toast.error("Add at least one step");
    setSaving(true);
    try {
      await createRoadmap({
        title: title.trim(),
        description: description.trim() || undefined,
        category, difficulty,
        duration: duration.trim() || undefined,
        topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
        steps: valid,
      });
      toast.success("Roadmap published!");
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Create a Roadmap</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} /></div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="category">Category</Label><Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={50} /></div>
          <div><Label htmlFor="difficulty">Difficulty</Label><Input id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} maxLength={20} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="duration-e-g-6-months">Duration (e.g. "6 months")</Label><Input id="duration-e-g-6-months" value={duration} onChange={(e) => setDuration(e.target.value)} maxLength={50} /></div>
          <div><Label htmlFor="topics-comma-separated">Topics (comma-separated)</Label><Input id="topics-comma-separated" value={topics} onChange={(e) => setTopics(e.target.value)} /></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Steps</Label>
            <Button size="sm" variant="outline" onClick={() => setSteps((s) => [...s, { title: "" }])}><Plus className="h-3 w-3 mr-1" />Add Step</Button>
          </div>
          {steps.map((s, i) => (
            <Card key={i} className="p-3 space-y-2">
              <Input placeholder={`Step ${i + 1} title`} value={s.title} onChange={(e) => setSteps((arr) => arr.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} maxLength={200} />
              <Textarea placeholder="Description (optional)" value={s.description || ""} onChange={(e) => setSteps((arr) => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} maxLength={500} />
            </Card>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Publish</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default Roadmaps;
