import { useState } from "react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BookOpen, Brain, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NoteAIFeaturesProps {
  noteId: string;
  noteTitle: string;
}

export const NoteAIFeatures = ({ noteId, noteTitle }: NoteAIFeaturesProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [quiz, setQuiz] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);

  const generateContent = async (type: string) => {
    setLoading(type);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ai/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ noteId, type, prompt: `generate ${type}` })
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();

      if (type === "summary") {
        setSummary(data.content);
      } else if (type === "quiz") {
        setQuiz(data.content || []);
        setCurrentQuizIndex(0);
        setShowQuizAnswer(false);
      } else if (type === "flashcards") {
        setFlashcards(data.content || []);
        setCurrentFlashcardIndex(0);
        setShowFlashcardBack(false);
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated!`);
    } catch (error: any) {
      console.error("Generate error:", error);
      toast.error(error.message || `Failed to generate ${type}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => generateContent("summary")}
          disabled={loading !== null}
          variant="outline"
          size="sm"
        >
          {loading === "summary" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          AI Summary
        </Button>
        <Button
          onClick={() => generateContent("quiz")}
          disabled={loading !== null}
          variant="outline"
          size="sm"
        >
          {loading === "quiz" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          Generate Quiz
        </Button>
        <Button
          onClick={() => generateContent("flashcards")}
          disabled={loading !== null}
          variant="outline"
          size="sm"
        >
          {loading === "flashcards" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BookOpen className="mr-2 h-4 w-4" />
          )}
          Generate Flashcards
        </Button>
      </div>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{summary}</p>
          </CardContent>
        </Card>
      )}

      {quiz.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Quiz Mode
              <Badge variant="secondary">
                Question {currentQuizIndex + 1} of {quiz.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium">{quiz[currentQuizIndex]?.question}</p>
            <div className="space-y-2">
              {quiz[currentQuizIndex]?.options?.map((option: string, i: number) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => setShowQuizAnswer(true)}
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuizAnswer && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium text-green-600">
                  Correct Answer: {quiz[currentQuizIndex]?.correct}
                </p>
                <p className="text-sm">{quiz[currentQuizIndex]?.explanation}</p>
              </div>
            )}
            <div className="flex gap-2 justify-between mt-4">
              <Button
                onClick={() => {
                  setCurrentQuizIndex((prev) => Math.max(0, prev - 1));
                  setShowQuizAnswer(false);
                }}
                disabled={currentQuizIndex === 0}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  setCurrentQuizIndex((prev) => Math.min(quiz.length - 1, prev + 1));
                  setShowQuizAnswer(false);
                }}
                disabled={currentQuizIndex === quiz.length - 1}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Flashcards
              <Badge variant="secondary">
                Card {currentFlashcardIndex + 1} of {flashcards.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="min-h-48 flex items-center justify-center p-6 bg-muted rounded-lg cursor-pointer"
              onClick={() => setShowFlashcardBack(!showFlashcardBack)}
            >
              <p className="text-center font-medium">
                {showFlashcardBack
                  ? flashcards[currentFlashcardIndex]?.back
                  : flashcards[currentFlashcardIndex]?.front}
              </p>
            </div>
            <p className="text-xs text-center text-muted-foreground">Click to flip</p>
            <div className="flex gap-2 justify-between">
              <Button
                onClick={() => {
                  setCurrentFlashcardIndex((prev) => Math.max(0, prev - 1));
                  setShowFlashcardBack(false);
                }}
                disabled={currentFlashcardIndex === 0}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  setCurrentFlashcardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                  setShowFlashcardBack(false);
                }}
                disabled={currentFlashcardIndex === flashcards.length - 1}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
