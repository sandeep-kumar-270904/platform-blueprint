import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { useSyncStatusToast } from "@/hooks/useSyncStatusToast";
import { useDecks, fetchCards, createDeck, reviewCard, type Deck, type Flashcard } from "@/hooks/useFlashcards";
import { useAuth } from "@/hooks/useAuth";
import { RotateCcw, ChevronLeft, ChevronRight, Brain, Plus, Loader2, Layers } from "lucide-react";
import { toast } from "sonner";

const Flashcards = () => {
  const { user } = useAuth();
  const { decks, loading, status } = useDecks();
  useSyncStatusToast(status, "Flashcards");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (selectedDeck) {
      fetchCards(selectedDeck.id).then((c) => {
        setCards(c);
        setCurrentCard(0);
        setFlipped(false);
      });
    }
  }, [selectedDeck]);

  const rate = async (ease: number) => {
    if (cards[currentCard]) await reviewCard(cards[currentCard].id, ease);
    if (currentCard + 1 < cards.length) {
      setCurrentCard(currentCard + 1);
      setFlipped(false);
    } else {
      toast.success("Deck complete!");
      setSelectedDeck(null);
    }
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
                <Badge variant="accent" className="mb-6"><Brain className="mr-1 h-3 w-3" />Active Learning</Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Flashcard{" "}
                  <span className="text-foreground display-font">Decks</span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Spaced-repetition flashcards built by the community. Study smarter, not harder.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {selectedDeck ? (
          <div>
            <Button variant="ghost" onClick={() => setSelectedDeck(null)} className="mb-4">← Back to decks</Button>
            <h2 className="text-2xl font-bold mb-6 text-center">{selectedDeck.title}</h2>
            {cards.length === 0 ? (
              <p className="text-center text-muted-foreground">No cards in this deck yet.</p>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Card {currentCard + 1} of {cards.length}</p>
                <Card className="max-w-2xl mx-auto h-96 cursor-pointer hover-scale" onClick={() => setFlipped(!flipped)}>
                  <CardContent className="flex items-center justify-center h-full p-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold mb-4">{flipped ? cards[currentCard].back : cards[currentCard].front}</p>
                      <p className="text-sm text-muted-foreground">{flipped ? "Answer" : "Question"} • Click to flip</p>
                      {!flipped && cards[currentCard].hint && <p className="text-xs text-muted-foreground mt-3 italic">Hint: {cards[currentCard].hint}</p>}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-center gap-4 mt-6">
                  <Button variant="outline" size="icon" onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false); }} disabled={currentCard === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setFlipped(!flipped)}><RotateCcw className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => { setCurrentCard(Math.min(cards.length - 1, currentCard + 1)); setFlipped(false); }} disabled={currentCard === cards.length - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {flipped && user && (
                  <div className="mt-6 flex justify-center gap-2">
                    <p className="text-sm text-muted-foreground self-center mr-2">Rate recall:</p>
                    {[1, 2, 3, 4, 5].map((e) => (
                      <Button key={e} size="sm" variant={e <= 2 ? "destructive" : e === 3 ? "secondary" : "default"} onClick={() => rate(e)}>{e}</Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-6">
              {user && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Deck</Button></DialogTrigger>
                  <CreateDeckDialog onClose={() => setCreateOpen(false)} />
                </Dialog>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : decks.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No decks yet — create the first one!</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((d, i) => (
                  <ScrollReveal key={d.id} delay={Math.min(0.05 * i, 0.3)}>
                    <Card className="hover-scale cursor-pointer h-full" onClick={() => setSelectedDeck(d)}>
                      <CardContent className="p-6">
                        <Badge variant="outline" className="mb-3">{d.category}</Badge>
                        <h3 className="text-lg font-bold mb-2">{d.title}</h3>
                        {d.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{d.description}</p>}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Layers className="h-4 w-4" /><span>{d.card_count} cards</span>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CreateDeckDialog = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [cards, setCards] = useState<{ front: string; back: string; hint?: string }[]>([{ front: "", back: "" }]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return toast.error("Title required");
    const valid = cards.filter((c) => c.front.trim() && c.back.trim());
    if (!valid.length) return toast.error("Add at least one card");
    setSaving(true);
    try {
      await createDeck({ title: title.trim(), description: description.trim() || undefined, category, cards: valid });
      toast.success("Deck published!");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Create a Deck</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} /></div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} /></div>
        <div><Label htmlFor="category">Category</Label><Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={50} /></div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Cards</Label>
            <Button size="sm" variant="outline" onClick={() => setCards((cs) => [...cs, { front: "", back: "" }])}><Plus className="h-3 w-3 mr-1" />Add Card</Button>
          </div>
          {cards.map((c, i) => (
            <Card key={i} className="p-3 space-y-2">
              <Input placeholder="Front (question)" value={c.front} onChange={(e) => setCards((cs) => cs.map((x, j) => j === i ? { ...x, front: e.target.value } : x))} maxLength={500} />
              <Input placeholder="Back (answer)" value={c.back} onChange={(e) => setCards((cs) => cs.map((x, j) => j === i ? { ...x, back: e.target.value } : x))} maxLength={500} />
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

export default Flashcards;
