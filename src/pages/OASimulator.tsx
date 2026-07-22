import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export const OASimulator = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const [tabSwitches, setTabSwitches] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/oa/results/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.status === 'Completed') {
          navigate(`/placement/oa/results/${id}`, { replace: true });
          return;
        }
        
        setAttempt(res.data);
        
        const expiresMs = new Date(res.data.expiresAt).getTime();
        const remain = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
        setTimeLeft(remain);
        
        // Load initial draft
        const sec = res.data.sections[0];
        if (sec && (sec.type === 'Coding' || sec.type === 'Debugging')) {
          setCodeDraft(sec.codingResponses[0]?.code || "");
        }
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        navigate('/placement');
      }
    };
    fetchAttempt();
  }, [id, navigate]);

  // Anti-cheat: Tab Switch Detection
  useEffect(() => {
    const handleBlur = () => {
      setTabSwitches(prev => {
        const newVal = prev + 1;
        toast.error(`Warning: Navigating away is not allowed. (Switch ${newVal})`, { duration: 5000 });
        syncProgress(newVal);
        return newVal;
      });
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [attempt]);

  // Timer Countdown & Auto-Submit
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev! - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const syncProgress = async (switches?: number) => {
    if (!attempt) return;
    try {
      const section = attempt.sections[currentSectionIdx];
      let payload: any = { sectionIndex: currentSectionIdx, tabSwitches: switches || tabSwitches };
      
      if (section.type === 'Coding' || section.type === 'Debugging') {
        const r = section.codingResponses[currentQuestionIdx];
        payload.questionId = r.question._id;
        payload.code = codeDraft;
      } else {
        const r = section.aptitudeResponses[currentQuestionIdx];
        payload.questionId = r.question._id;
        payload.selectedAnswer = r.selectedAnswer;
      }

      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/oa/sync/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to sync progress', err);
    }
  };

  const handleNext = async () => {
    await syncProgress();
    
    const section = attempt.sections[currentSectionIdx];
    const totalQ = section.type === 'Aptitude' ? section.aptitudeResponses.length : section.codingResponses.length;
    
    if (currentQuestionIdx < totalQ - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      // Load next draft
      if (section.type === 'Coding' || section.type === 'Debugging') {
        setCodeDraft(section.codingResponses[currentQuestionIdx + 1]?.code || "");
      }
    } else if (currentSectionIdx < attempt.sections.length - 1) {
      setCurrentSectionIdx(currentSectionIdx + 1);
      setCurrentQuestionIdx(0);
      const nextSec = attempt.sections[currentSectionIdx + 1];
      if (nextSec.type === 'Coding' || nextSec.type === 'Debugging') {
        setCodeDraft(nextSec.codingResponses[0]?.code || "");
      }
    } else {
      // End of test
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    await syncProgress();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/oa/submit/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/placement/oa/results/${id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit OA");
      setSubmitting(false);
    }
  };

  if (loading || timeLeft === null) return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin"/></div>;

  const section = attempt.sections[currentSectionIdx];
  const isAptitude = section.type === 'Aptitude';
  const totalQ = isAptitude ? section.aptitudeResponses.length : section.codingResponses.length;
  const isLastQuestion = currentQuestionIdx === totalQ - 1 && currentSectionIdx === attempt.sections.length - 1;

  const currentQ = isAptitude ? section.aptitudeResponses[currentQuestionIdx].question : section.codingResponses[currentQuestionIdx].question;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar (Proctored Feel) */}
      <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="font-bold text-lg">{attempt.oaDefinition.name}</h1>
          <p className="text-sm opacity-80">{section.title} - Question {currentQuestionIdx + 1} of {totalQ}</p>
        </div>
        <div className="flex items-center gap-6">
          {tabSwitches > 0 && <span className="text-red-300 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Tab Switch Warning</span>}
          <div className={`text-xl font-mono font-bold flex items-center gap-2 ${timeLeft < 300 ? 'text-red-300 animate-pulse' : ''}`}>
            <Clock className="w-5 h-5"/> {formatTime(timeLeft)}
          </div>
          <Button variant="secondary" size="sm" onClick={handleSubmit} disabled={submitting}>Submit Test</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Question */}
        <div className="w-1/3 border-r p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{currentQ.title || currentQ.questionText}</h2>
          
          {isAptitude ? (
            <div className="space-y-4 mt-6">
              {currentQ.options?.map((opt: string, i: number) => (
                <div 
                  key={i} 
                  className={`p-4 border rounded cursor-pointer transition-colors ${section.aptitudeResponses[currentQuestionIdx].selectedAnswer === i ? 'bg-primary/20 border-primary' : 'hover:bg-muted'}`}
                  onClick={() => {
                    const newAttempt = {...attempt};
                    newAttempt.sections[currentSectionIdx].aptitudeResponses[currentQuestionIdx].selectedAnswer = i;
                    setAttempt(newAttempt);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          ) : (
            <div className="prose dark:prose-invert text-sm max-w-none">
              <p>{currentQ.description}</p>
              {section.type === 'Debugging' && currentQ.buggyCodeSnippet && (
                <div className="mt-4 p-4 bg-muted rounded font-mono text-xs overflow-x-auto text-red-400">
                  // Fix this code:<br/>
                  {currentQ.buggyCodeSnippet}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Code Editor (only if not aptitude) */}
        {!isAptitude && (
          <div className="flex-1 flex flex-col p-4 bg-[#1e1e1e]">
            <div className="flex justify-between items-center mb-2 text-white">
              <span className="text-sm text-gray-400">Language: JavaScript</span>
              <Button variant="outline" size="sm" className="bg-transparent text-white border-gray-600 hover:bg-gray-800" onClick={() => syncProgress()}>Run Code (Simulated)</Button>
            </div>
            <textarea 
              className="flex-1 w-full bg-[#1e1e1e] text-green-400 font-mono text-sm p-4 outline-none border border-gray-700 rounded resize-none"
              value={codeDraft}
              onChange={(e) => setCodeDraft(e.target.value)}
              placeholder="Write your code here..."
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t bg-background flex justify-end">
        <Button onClick={handleNext} disabled={submitting}>
          {isLastQuestion ? 'Final Submit' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
};
