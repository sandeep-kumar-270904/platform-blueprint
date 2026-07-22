import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, MessageSquare, Info } from 'lucide-react';

export const mockTopics = [
  {
    id: 1,
    title: 'Impact of AI on Employment',
    category: 'Technology & Ethics',
    blurb: 'Artificial Intelligence is rapidly automating tasks across industries. Will it lead to mass unemployment or create new, higher-value jobs?',
    difficulty: 'Easy to structure',
    pointsFor: ['Increases productivity and creates new tech roles.', 'Automates dangerous or repetitive tasks.', 'Forces upskilling.'],
    pointsAgainst: ['Displaces low-skilled workers quickly.', 'Widens the wealth gap.', 'May happen faster than society can adapt.'],
    structureTips: 'Acknowledge both sides early. Use a "short-term pain vs long-term gain" framework.',
    mistakes: 'Avoid being purely pessimistic or blindly optimistic. Nuance is key.'
  },
  {
    id: 2,
    title: 'Moonlighting: Ethical or Not?',
    category: 'Controversial/Opinion-based',
    blurb: 'With remote work, many employees take up second jobs (moonlighting). Companies argue it hurts productivity and breaches contracts.',
    difficulty: 'Hard to structure',
    pointsFor: ['Provides financial security in tough economies.', 'Employees have the right to their free time.', 'Builds diverse skill sets.'],
    pointsAgainst: ['Conflict of interest if working for competitors.', 'Leads to burnout and reduced primary job performance.', 'Breach of trust and employment contracts.'],
    structureTips: 'Define moonlighting clearly in your opening. Separate ethical considerations from legal/contractual ones.',
    mistakes: 'Don\'t get aggressive if others disagree; this is a highly polarizing topic.'
  },
  {
    id: 3,
    title: 'Is India ready for Electric Vehicles?',
    category: 'Current Affairs',
    blurb: 'The government is pushing for EV adoption to reduce carbon footprint and oil imports, but infrastructure challenges remain.',
    difficulty: 'Easy to structure',
    pointsFor: ['Reduces pollution in highly polluted cities.', 'Decreases reliance on imported oil.', 'Government subsidies are making it viable.'],
    pointsAgainst: ['Lack of charging infrastructure.', 'High upfront costs for consumers.', 'Grid relies heavily on coal, offsetting some green benefits.'],
    structureTips: 'Use a PESTLE approach (Political, Economic, Social, Technological, Legal, Environmental) to structure your points.',
    mistakes: 'Focusing only on cars and ignoring 2-wheelers which dominate the Indian market.'
  }
];

export function GDTopicsLibrary() {
  const [selectedTopic, setSelectedTopic] = useState<typeof mockTopics[0] | null>(null);
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(mockTopics.map(t => t.category)))];
  
  const filteredTopics = filter === 'All' ? mockTopics : mockTopics.filter(t => t.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <Badge 
            key={cat} 
            variant={filter === cat ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap text-sm py-1.5 px-3"
            onClick={() => setFilter(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map(topic => (
          <Card key={topic.id} className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedTopic(topic)}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className="mb-2">{topic.category}</Badge>
                <Badge variant={topic.difficulty === 'Hard to structure' ? 'destructive' : 'default'} className="opacity-80 flex items-center gap-1" aria-label={`Difficulty: ${topic.difficulty}`}>
                  {topic.difficulty === 'Hard to structure' ? <AlertCircle className="w-3 h-3" aria-hidden="true" /> : <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                  {topic.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-xl leading-tight">{topic.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">{topic.blurb}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full text-primary justify-between">
                View Details <Info className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTopic && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedTopic.title}</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  {selectedTopic.blurb}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-green-500/5 border-green-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center text-green-700 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Points For / Pros
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {selectedTopic.pointsFor.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-500/5 border-red-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center text-red-700 dark:text-red-400">
                          <AlertCircle className="w-4 h-4 mr-2" /> Points Against / Cons
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {selectedTopic.pointsAgainst.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-bold flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Structure Tips
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">
                      {selectedTopic.structureTips}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-destructive">
                      <AlertCircle className="w-4 h-4" /> Common Mistakes
                    </h4>
                    <p className="text-sm text-muted-foreground bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20">
                      {selectedTopic.mistakes}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
