import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles, Check, X, Mic } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useResume } from '@/context/ResumeContext';

export const AiEditingAssistant: React.FC<{ resumeId: string }> = ({ resumeId }) => {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposedDiff, setProposedDiff] = useState<any>(null);
  const { token } = useAuth();
  const { resume, updateResume } = useResume();
  const [isListening, setIsListening] = useState(false);

  const handleEditRequest = async () => {
    if (!instruction) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${resumeId}/edit-propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ instruction })
      });
      if (res.ok) {
        const data = await res.json();
        setProposedDiff(data.diff);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (proposedDiff) {
      updateResume(proposedDiff);
      setProposedDiff(null);
      setInstruction('');
    }
  };

  const handleReject = () => {
    setProposedDiff(null);
  };

  const toggleListen = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInstruction(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  return (
    <Card className="mt-6 border-blue-200 dark:border-blue-900/50">
      <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Sparkles className="h-4 w-4" /> AI Editing Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {!proposedDiff ? (
          <div className="flex gap-2">
            <Input 
              placeholder="e.g. Add a project called E-commerce..."
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEditRequest()}
            />
            <Button variant="outline" size="icon" onClick={toggleListen} className={isListening ? 'bg-red-100 text-red-600' : ''}>
              <Mic className="h-4 w-4" />
            </Button>
            <Button onClick={handleEditRequest} disabled={loading || !instruction}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap font-mono border max-h-40 overflow-y-auto">
              {JSON.stringify(proposedDiff, null, 2)}
            </div>
            <div className="flex gap-2">
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleAccept}>
                <Check className="h-4 w-4 mr-2" /> Accept Changes
              </Button>
              <Button className="w-full" variant="outline" onClick={handleReject}>
                <X className="h-4 w-4 mr-2" /> Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
