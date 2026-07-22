import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircle, UserX, AlertTriangle, Eye, Activity } from 'lucide-react';

const lessons = [
  {
    id: 'lesson-1',
    title: 'How to disagree politely in a GD',
    icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
    content: `Don't say: "You're wrong" or "I completely disagree."\n\nInstead say:\n- "I see your point, however, I believe..."\n- "Adding to your point, we must also consider..."\n- "That's an interesting perspective, but looking at the statistics..."\n\nThis shows you are a listener and a team player, not aggressive.`
  },
  {
    id: 'lesson-2',
    title: 'Body language basics',
    icon: <Eye className="w-5 h-5 text-green-500" />,
    content: `- Keep an open posture. Don't cross your arms, it signals defensiveness.\n- Maintain eye contact with the person speaking, and sweep the group when you are speaking.\n- Lean in slightly to show engagement.\n- Nod to acknowledge others' points.`
  },
  {
    id: 'lesson-3',
    title: 'What to do if you don\'t know the topic',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    content: `- Don't panic and don't speak first.\n- Listen carefully to the first 2-3 speakers to understand the context.\n- Paraphrase and build upon what they said: "As X mentioned earlier, [point], which means we should also focus on..."\n- Bring in a general framework (like Economic or Social impact) which applies to almost any topic.`
  },
  {
    id: 'lesson-4',
    title: 'Handling the dominator',
    icon: <UserX className="w-5 h-5 text-red-500" />,
    content: `- If someone isn't letting others speak, interject politely but firmly: "Those are valid points, let's also hear what [Name] has to say about this."\n- This demonstrates extreme leadership and facilitation skills to the moderator.\n- Don't get into a shouting match.`
  },
  {
    id: 'lesson-5',
    title: 'Structuring a strong entry',
    icon: <Activity className="w-5 h-5 text-purple-500" />,
    content: `- Don't just jump in with a random point.\n- Framework: [Acknowledge previous speaker] + [State your premise] + [Provide 1 supporting fact].\n- Example: "I agree with the economic concern raised. Building on that, the primary issue is X, because according to recent data, Y is happening."`
  }
];

export function CommunicationLessons({ 
  completedCount, 
  onUpdateCount, 
  totalLessons 
}: { 
  completedCount: number, 
  onUpdateCount: (count: number) => void,
  totalLessons: number 
}) {
  const [completedLessons, setCompletedLessons] = React.useState<Record<string, boolean>>({});

  const toggleLesson = (id: string, checked: boolean) => {
    const newCompleted = { ...completedLessons, [id]: checked };
    setCompletedLessons(newCompleted);
    const newCount = Object.values(newCompleted).filter(Boolean).length;
    onUpdateCount(newCount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Communication Micro-Lessons</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bite-sized tips to improve your GD performance. Mark them as done once you've internalized them.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {lessons.map(lesson => (
              <AccordionItem key={lesson.id} value={lesson.id} className="border rounded-lg px-4 bg-card">
                <div className="flex items-center w-full">
                  <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={!!completedLessons[lesson.id]}
                      onCheckedChange={(c) => toggleLesson(lesson.id, !!c)}
                    />
                  </div>
                  <AccordionTrigger className="hover:no-underline py-4 flex-1">
                    <div className="flex items-center gap-3 text-left">
                      {lesson.icon}
                      <span className={`font-medium ${completedLessons[lesson.id] ? 'line-through text-muted-foreground' : ''}`}>
                        {lesson.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                </div>
                <AccordionContent className="pb-4 pl-12 text-muted-foreground whitespace-pre-wrap">
                  {lesson.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
