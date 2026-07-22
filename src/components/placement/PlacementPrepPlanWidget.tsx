import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const PlacementPrepPlanWidget = ({ planData, onAdjustPlan }: { planData: any, onAdjustPlan: () => void }) => {
  const navigate = useNavigate();
  const [localPlan, setLocalPlan] = useState(planData);
  const [loadingTask, setLoadingTask] = useState<string | null>(null);

  const toggleTask = async (phaseIdx: number, taskIdx: number, taskId: string, currentValue: boolean) => {
    setLoadingTask(taskId);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-onboarding/task/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_completed: !currentValue })
      });
      
      if (!res.ok) throw new Error("Failed to update task");
      
      const updatedPlan = await res.json();
      setLocalPlan(updatedPlan.active_plan);
      
      if (!currentValue) {
        toast.success("Task completed! Keep it up.");
      }
    } catch (err) {
      toast.error("Error updating task");
    } finally {
      setLoadingTask(null);
    }
  };

  if (!localPlan || !localPlan.phases) return null;

  return (
    <Card className="border-primary/20 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <Button variant="ghost" size="sm" onClick={onAdjustPlan} className="text-muted-foreground hover:text-primary">
          <Settings className="w-4 h-4 mr-2" /> Adjust Plan
        </Button>
      </div>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-primary" /> Your Personalized Prep Plan
          {localPlan.version > 1 && (
            <Badge variant="outline" className="ml-2 text-xs">v{localPlan.version}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Based on your profile, here is your week-by-week roadmap to placement readiness.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {localPlan.phases.map((phase: any, pIdx: number) => {
            const completedTasks = phase.tasks.filter((t: any) => t.is_completed).length;
            const totalTasks = phase.tasks.length;
            const isFullyComplete = totalTasks > 0 && completedTasks === totalTasks;
            
            return (
              <div key={phase._id || pIdx} className="relative pl-6 pb-2 before:absolute before:left-[11px] before:top-2 before:bottom-[-16px] before:w-[2px] last:before:hidden before:bg-border">
                {/* Timeline Node */}
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 ring-2 ring-background flex items-center justify-center ${isFullyComplete ? 'bg-primary border-primary' : 'bg-background border-primary/40'}`}>
                  {isFullyComplete && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                </div>
                
                <Accordion type="single" collapsible defaultValue={pIdx === 0 ? `item-${pIdx}` : undefined} className="w-full bg-muted/20 border rounded-lg px-4 -mt-2">
                  <AccordionItem value={`item-${pIdx}`} className="border-b-0">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex flex-col md:flex-row md:items-center text-left gap-2 w-full">
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-1">{phase.timeframe}</Badge>
                          <h4 className={`font-bold text-lg ${isFullyComplete ? 'text-muted-foreground line-through decoration-1' : ''}`}>
                            {phase.title}
                          </h4>
                        </div>
                        <div className="text-sm text-muted-foreground mr-4 shrink-0">
                          {completedTasks} / {totalTasks} tasks
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <p className="text-muted-foreground mb-4">{phase.description}</p>
                      <div className="space-y-3">
                        {phase.tasks.map((task: any, tIdx: number) => (
                          <div key={task._id || tIdx} className="flex items-start gap-3 p-3 bg-background rounded border group">
                            <Checkbox 
                              checked={task.is_completed} 
                              disabled={task.auto_verify || loadingTask === task._id}
                              onCheckedChange={() => toggleTask(pIdx, tIdx, task._id, task.is_completed)}
                              className="mt-1"
                            />
                            <div className="flex-1 flex flex-col justify-center">
                              <p className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </p>
                              {task.auto_verify && (
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mt-1">
                                  Auto-tracked
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                              <a href={task.dynamic_link || task.link}>
                                Go <ChevronRight className="w-4 h-4 ml-1" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
