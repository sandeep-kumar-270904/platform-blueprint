import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Rocket, Target, Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingModalProps {
  onComplete: (preferences: OnboardingPreferences) => void;
}

export interface OnboardingPreferences {
  source: string;
  purpose: string;
  tips: string;
}

const questions = [
  {
    id: "source",
    title: "How did you hear about us?",
    icon: Rocket,
    options: [
      { value: "social", label: "Social Media", description: "Facebook, Twitter, Instagram" },
      { value: "friend", label: "Friend/Colleague", description: "Word of mouth" },
      { value: "search", label: "Search Engine", description: "Google, Bing, etc." },
      { value: "college", label: "College/University", description: "Campus promotion" },
      { value: "other", label: "Other", description: "Something else" },
    ],
  },
  {
    id: "purpose",
    title: "What are you here for?",
    icon: Target,
    options: [
      { value: "notes", label: "Study Notes", description: "Access and share notes" },
      { value: "innovation", label: "Innovation & Startups", description: "Build ideas with teams" },
      { value: "jobs", label: "Jobs & Placements", description: "Find career opportunities" },
      { value: "community", label: "Community & Events", description: "Connect with peers" },
      { value: "all", label: "Everything!", description: "Explore all features" },
    ],
  },
  {
    id: "tips",
    title: "Would you like personalized tips?",
    icon: Sparkles,
    options: [
      { value: "daily", label: "Daily Tips", description: "Get tips every day" },
      { value: "weekly", label: "Weekly Digest", description: "Summary once a week" },
      { value: "smart", label: "Smart Notifications", description: "Based on your activity" },
      { value: "none", label: "No Thanks", description: "I'll explore on my own" },
    ],
  },
];

export const OnboardingModal = ({ onComplete }: OnboardingModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    localStorage.setItem("onboardingPreferences", JSON.stringify(answers));
    setIsOpen(false);
    onComplete({
      source: answers.source || "",
      purpose: answers.purpose || "",
      tips: answers.tips || "",
    });
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
    onComplete({ source: "", purpose: "", tips: "" });
  };

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const canProceed = answers[currentQuestion.id];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="gradient-hero p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6" />
              Welcome to the Platform!
            </DialogTitle>
            <DialogDescription className="text-center text-primary-foreground/80">
              Help us personalize your experience
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Progress value={progress} className="h-2 bg-primary-foreground/20" />
            <p className="text-xs text-center mt-2 text-primary-foreground/70">
              Step {step + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <currentQuestion.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{currentQuestion.title}</h3>
              </div>

              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <motion.div
                    key={option.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        answers[currentQuestion.id] === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {answers[currentQuestion.id] === option.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </Label>
                  </motion.div>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip
            </Button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext} disabled={!canProceed} className="gap-1">
                {step === questions.length - 1 ? (
                  <>
                    Get Started
                    <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
