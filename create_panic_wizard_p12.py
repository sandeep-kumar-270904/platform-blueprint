import os

panic_wizard = """import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';

export default function PanicModeWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState('');
  const [focus, setFocus] = useState('');
  const [topSkills, setTopSkills] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRebuild = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${id}/panic-rebuild`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetRole, focus, topSkills })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Panic Rebuild Complete!");
        // Navigate to the newly generated tagged variant
        navigate(`/resume/builder/${data._id}`);
      } else {
        toast.error("Rebuild failed");
      }
    } catch (err) {
      toast.error("Error during rebuild");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full border-red-500/20 shadow-lg shadow-red-500/10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <Zap className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-3xl text-red-600 dark:text-red-400">Panic Mode</CardTitle>
          <CardDescription className="text-lg">Rapidly restructure your resume for an urgent deadline.</CardDescription>
          <p className="text-sm font-medium text-muted-foreground mt-2">Estimated time: ~5 minutes</p>
        </CardHeader>

        <CardContent className="mt-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-medium">1. What role are you rushing to apply for?</h3>
              <Input 
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="text-lg py-6"
              />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-medium">2. What recent experience should we highlight the most?</h3>
              <Textarea 
                value={focus}
                onChange={e => setFocus(e.target.value)}
                placeholder="e.g. My time at Acme Corp leading the React migration"
                className="min-h-[100px] text-base"
              />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-medium">3. List 3 key skills to front-load:</h3>
              <Input 
                value={topSkills}
                onChange={e => setTopSkills(e.target.value)}
                placeholder="e.g. React, TypeScript, GraphQL"
                className="text-lg py-6"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate('/resume')} disabled={isGenerating}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!targetRole && step === 1}>
              Next Step
            </Button>
          ) : (
            <Button onClick={handleRebuild} disabled={isGenerating || !topSkills} className="bg-red-600 hover:bg-red-700 text-white">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restructuring...</> : 'Launch Panic Rebuild'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="flex gap-2 mt-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-2 w-16 rounded-full transition-colors ${s <= step ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
        ))}
      </div>
    </div>
  );
}
"""

with open("src/pages/PanicModeWizard.tsx", "w", encoding="utf-8") as f:
    f.write(panic_wizard)
print("Created PanicModeWizard.tsx")
