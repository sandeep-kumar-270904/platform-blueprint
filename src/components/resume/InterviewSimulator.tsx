import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Mic, MessageSquare, CheckCircle, AlertTriangle, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface InterviewSimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

export const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({ open, onOpenChange, resumeId }) => {
  const [step, setStep] = useState<'setup' | 'interview' | 'results'>('setup');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState('');

  const startInterview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/interviews/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resumeId, pastedJobDescription: jobDescription })
      });
      if (res.ok) {
        setSession(await res.json());
        setStep('interview');
        setCurrentQIndex(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !session) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const currentQ = session.questions[currentQIndex];
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/interviews/${session._id}/questions/${currentQ._id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answer })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        setSession(updatedSession);
        setAnswer('');
        
        // Don't auto-advance. Let the user read the feedback first.
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < session.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setStep('results');
    }
  };

  const handleClose = () => {
    setStep('setup');
    setSession(null);
    setJobDescription('');
    setAnswer('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            AI Interview Simulator
          </DialogTitle>
          {step === 'setup' && <DialogDescription>Practice with questions grounded in your actual resume.</DialogDescription>}
        </DialogHeader>

        {step === 'setup' && (
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <Label>Target Job Description (Optional)</Label>
              <Textarea 
                placeholder="Paste a job description to tailor the interview questions..." 
                rows={10}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">If left blank, questions will focus purely on your resume.</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={startInterview} disabled={loading} size="lg">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing...</> : 'Start Mock Interview'}
              </Button>
            </div>
          </div>
        )}

        {step === 'interview' && session && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex justify-between items-center text-sm font-medium text-muted-foreground">
              <span>Question {currentQIndex + 1} of {session.questions.length}</span>
              <Badge variant="outline">{session.questions[currentQIndex].category}</Badge>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg border mb-4">
              <p className="text-lg font-medium">{session.questions[currentQIndex].question}</p>
            </div>

            <ScrollArea className="flex-1 mb-4 pr-4">
              {session.questions[currentQIndex].aiEvaluation ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 bg-background border rounded-lg shadow-sm">
                    <p className="text-sm font-semibold mb-2">Your Answer:</p>
                    <p className="text-sm text-muted-foreground italic">{session.questions[currentQIndex].userAnswer}</p>
                  </div>
                  
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> AI Feedback (Score: {session.questions[currentQIndex].aiEvaluation.score}/100)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-semibold flex items-center text-green-700 mb-2"><CheckCircle className="h-4 w-4 mr-1"/> Strengths</h5>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {session.questions[currentQIndex].aiEvaluation.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold flex items-center text-amber-700 mb-2"><AlertTriangle className="h-4 w-4 mr-1"/> To Improve</h5>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {session.questions[currentQIndex].aiEvaluation.improvementAreas.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={nextQuestion}>
                      {currentQIndex < session.questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 h-full flex flex-col">
                  <Label>Your Answer</Label>
                  <Textarea 
                    className="flex-1 min-h-[200px]"
                    placeholder="Type your answer here as if you were speaking..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <div className="flex justify-end pt-4">
                    <Button onClick={submitAnswer} disabled={!answer.trim() || loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit Answer</>}
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {step === 'results' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
            <h2 className="text-2xl font-bold">Interview Completed!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Great practice. Your feedback has been saved and will contribute to your Interview Readiness insights.
            </p>
            <Button onClick={handleClose} size="lg" className="mt-8">Return to Dashboard</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
