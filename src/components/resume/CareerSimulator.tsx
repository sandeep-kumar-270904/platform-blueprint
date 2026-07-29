import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Briefcase, TrendingUp, AlertCircle } from "lucide-react";

export const CareerSimulator: React.FC<{ resumeId: string }> = ({ resumeId }) => {
  const [targetRole, setTargetRole] = useState('');
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (!targetRole) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/simulator/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumeId, targetRole })
      });
      if (res.ok) {
        setSimulation(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-8 border-purple-200 dark:border-purple-900/50">
      <CardHeader className="bg-purple-50/50 dark:bg-purple-900/10">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Career Path Simulator
        </CardTitle>
        <CardDescription>
          Explore a possible multi-year trajectory to a specific target role based on your current resume's skill gaps.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex gap-2">
          <Input 
            placeholder="E.g., Senior Full Stack Engineer, CTO, Data Scientist..."
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
          />
          <Button onClick={handleSimulate} disabled={loading || !targetRole} className="bg-purple-600 hover:bg-purple-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Briefcase className="h-4 w-4 mr-2"/>}
            Simulate Path
          </Button>
        </div>

        {simulation && (
          <div className="space-y-6">
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-3 rounded-md text-xs border flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{simulation.disclaimer}</p>
            </div>
            
            <div className="relative border-l-2 border-purple-200 dark:border-purple-800 ml-3 space-y-8">
              {simulation.simulation?.map((step: any, i: number) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute w-4 h-4 bg-purple-500 rounded-full -left-[9px] top-1 border-4 border-white dark:border-background" />
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{step.timeframe}</span>
                  <h4 className="text-lg font-bold">{step.title}</h4>
                  <p className="text-sm font-medium mt-1 mb-2">Focus: {step.focus}</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {step.milestones?.map((m: string, j: number) => (
                      <li key={j}>{m}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
