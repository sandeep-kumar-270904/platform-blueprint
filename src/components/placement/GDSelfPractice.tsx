import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { mockTopics } from './GDTopicsLibrary';
import { Timer, Play, Square, CheckCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export function GDSelfPractice({ onPracticeComplete }: { onPracticeComplete: () => void }) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [phase, setPhase] = useState<'idle' | 'prep' | 'speak' | 'review'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [notes, setNotes] = useState({ opening: '', body: '', closing: '' });
  const [checklist, setChecklist] = useState({ structure: false, acknowledge: false, onTopic: false, eyeContact: false });

  const prepTime = 120; // 2 mins
  const speakTime = 180; // 3 mins

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((phase === 'prep' || phase === 'speak') && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      if (phase === 'prep') {
        toast.info("Prep time over! Begin speaking.");
        setPhase('speak');
        setTimeLeft(speakTime);
      } else if (phase === 'speak') {
        toast.success("Time's up! Let's review.");
        setPhase('review');
      }
    }
    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  const startPractice = () => {
    if (!selectedTopicId) return toast.error("Please select a topic first.");
    setNotes({ opening: '', body: '', closing: '' });
    setChecklist({ structure: false, acknowledge: false, onTopic: false, eyeContact: false });
    setPhase('prep');
    setTimeLeft(prepTime);
  };

  const stopPractice = () => {
    setPhase('review');
  };

  const finishReview = () => {
    onPracticeComplete();
    setPhase('idle');
    toast.success("Practice recorded!");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activeTopic = mockTopics.find(t => t.id.toString() === selectedTopicId);

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle>Self-Practice Mode</CardTitle>
        <CardDescription>Simulate a GD environment. 2 minutes to prepare your thoughts, 3 minutes to speak.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {phase === 'idle' && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select a Topic</label>
              <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a GD topic..." />
                </SelectTrigger>
                <SelectContent>
                  {mockTopics.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {activeTopic && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">{activeTopic.blurb}</p>
              </div>
            )}

            <Button onClick={startPractice} className="w-full md:w-auto" disabled={!selectedTopicId}>
              <Play className="w-4 h-4 mr-2" /> Start Practice Timer
            </Button>
          </div>
        )}

        {(phase === 'prep' || phase === 'speak') && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-card border p-4 rounded-xl shadow-sm gap-4">
              <div>
                <h3 className="font-bold text-lg">{activeTopic?.title}</h3>
                <p className="text-sm text-primary font-medium flex items-center gap-2">
                  {phase === 'prep' ? 'Preparation Phase' : 'Speaking Phase'}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div 
                  className={`text-4xl font-mono tracking-wider ${timeLeft < 30 ? 'text-destructive animate-pulse' : ''}`}
                  role="timer"
                  aria-live={timeLeft < 30 ? "assertive" : "polite"}
                  aria-atomic="true"
                >
                  <span className="sr-only">Time remaining: </span>
                  {formatTime(timeLeft)}
                </div>
                <Button variant="destructive" size="icon" onClick={stopPractice} aria-label="Stop practice early">
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="gd-opening" className="text-sm font-medium flex items-center gap-2"><Timer className="w-4 h-4" aria-hidden="true"/> Opening Hook</label>
                <Textarea 
                  id="gd-opening"
                  placeholder="How will you start? Definitions, quotes, context..." 
                  className="resize-none h-32"
                  value={notes.opening}
                  onChange={e => setNotes({...notes, opening: e.target.value})}
                  disabled={phase === 'speak'}
                  aria-describedby="gd-opening-desc"
                />
                <span id="gd-opening-desc" className="sr-only">Notes for opening your discussion</span>
              </div>
              <div className="space-y-2">
                <label htmlFor="gd-body" className="text-sm font-medium flex items-center gap-2"><Timer className="w-4 h-4" aria-hidden="true"/> Key Points</label>
                <Textarea 
                  id="gd-body"
                  placeholder="Your 2-3 strongest arguments..." 
                  className="resize-none h-32"
                  value={notes.body}
                  onChange={e => setNotes({...notes, body: e.target.value})}
                  disabled={phase === 'speak'}
                  aria-describedby="gd-body-desc"
                />
                <span id="gd-body-desc" className="sr-only">Notes for main arguments</span>
              </div>
              <div className="space-y-2">
                <label htmlFor="gd-closing" className="text-sm font-medium flex items-center gap-2"><Timer className="w-4 h-4" aria-hidden="true"/> Closing Summary</label>
                <Textarea 
                  id="gd-closing"
                  placeholder="How will you conclude and synthesize?" 
                  className="resize-none h-32"
                  value={notes.closing}
                  onChange={e => setNotes({...notes, closing: e.target.value})}
                  disabled={phase === 'speak'}
                  aria-describedby="gd-closing-desc"
                />
                <span id="gd-closing-desc" className="sr-only">Notes for your conclusion</span>
              </div>
            </div>
            
            {phase === 'speak' && (
              <div className="bg-primary/10 p-4 rounded-lg text-center animate-in fade-in zoom-in duration-500">
                <p className="font-medium text-primary">Now Speaking! Try recording yourself on your phone or practice out loud.</p>
              </div>
            )}
          </div>
        )}

        {phase === 'review' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">Practice Completed</h3>
              <p className="text-muted-foreground">Self-reflection is the key to improving.</p>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="structure" 
                    checked={checklist.structure} 
                    onCheckedChange={(c) => setChecklist({...checklist, structure: !!c})}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="structure" className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Did I structure my points clearly?
                    </label>
                    <p className="text-sm text-muted-foreground">Opening -> Key Body Points -> Conclusion</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="acknowledge" 
                    checked={checklist.acknowledge} 
                    onCheckedChange={(c) => setChecklist({...checklist, acknowledge: !!c})}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="acknowledge" className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Did I acknowledge counter-arguments?
                    </label>
                    <p className="text-sm text-muted-foreground">A good GD participant listens and integrates opposing views.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="onTopic" 
                    checked={checklist.onTopic} 
                    onCheckedChange={(c) => setChecklist({...checklist, onTopic: !!c})}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="onTopic" className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Did I stay on topic?
                    </label>
                    <p className="text-sm text-muted-foreground">Avoided drifting into unrelated tangents.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setPhase('idle')}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
              <Button onClick={finishReview}>Save & Complete</Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
