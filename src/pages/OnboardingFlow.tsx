import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, ChevronLeft, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const questions = [
  {
    id: "academic_stage",
    title: "What stage are you at right now?",
    type: "single",
    options: ["1st Year", "2nd Year", "3rd Year", "Final Year", "Graduate/Alumni"]
  },
  {
    id: "field_of_study",
    title: "What are you studying?",
    type: "searchable",
    options: ["Computer Science", "Mechanical", "Electrical", "Civil", "Commerce", "Business", "Arts & Humanities", "Medicine", "Other"]
  },
  {
    id: "primary_goal",
    title: "What brought you to StudentHub?",
    type: "single",
    options: ["Placement & Career Prep", "Study Resources & Notes", "Networking & Community", "Internships & Opportunities", "Just Exploring"]
  },
  {
    id: "six_month_goals",
    title: "What are you hoping to achieve in the next 6 months?",
    type: "multi",
    options: ["Crack Placements", "Build a Strong Resume", "Learn New Skills", "Find an Internship", "Connect with Mentors", "Improve Communication/Interview Skills"]
  },
  {
    id: "learning_style",
    title: "How do you prefer to learn?",
    type: "single",
    options: ["Solo, Focused Study", "Group Study & Discussion", "Mix of Both"]
  },
  {
    id: "time_availability",
    title: "How much time can you dedicate weekly?",
    type: "single",
    options: ["Less than 5 hrs", "5-10 hrs", "10-20 hrs", "20+ hrs"]
  },
  {
    id: "biggest_challenge",
    title: "What's your biggest challenge right now?",
    type: "single",
    options: ["Staying Consistent", "Finding Good Resources", "Interview Confidence", "Networking/Connections", "Time Management", "Not Sure Yet"]
  }
];

export const OnboardingFlow = () => {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(0); // 0 = Welcome, 1-7 = Questions, 8 = Summary
  const [answers, setAnswers] = useState<Record<string, any>>({ six_month_goals: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = questions.length;

  const handleNext = () => setStep(s => Math.min(s + 1, totalQuestions + 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSelectSingle = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setTimeout(handleNext, 400); // Auto-advance for single select
  };

  const handleToggleMulti = (id: string, value: string) => {
    setAnswers(prev => {
      const current = prev[id] || [];
      if (current.includes(value)) {
        return { ...prev, [id]: current.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [id]: [...current, value] };
      }
    });
  };

  const completeOnboarding = async (skipped = false) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_URL}/api/users/me/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          hasCompletedOnboarding: true,
          onboardingPreferences: skipped ? {} : answers
        })
      });
      await fetchUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error("Failed to complete onboarding", err);
      navigate('/dashboard', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    initial: (direction: number) => ({
      x: shouldReduceMotion ? 0 : direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    },
    exit: (direction: number) => ({
      x: shouldReduceMotion ? 0 : direction < 0 ? 1000 : -1000,
      opacity: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    })
  };

  const [direction, setDirection] = useState(1);
  const changeStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const renderCard = (option: string, isSelected: boolean, onClick: () => void) => (
    <motion.button
      key={option}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-5 sm:p-6 rounded-2xl border-2 text-left relative transition-all duration-300 ${
        isSelected 
          ? "border-primary bg-primary/5 text-primary shadow-sm" 
          : "border-border/50 bg-card hover:border-primary/50 text-foreground hover:shadow-sm"
      }`}
    >
      <span className="text-lg font-medium pr-8">{option}</span>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute right-5 top-1/2 -translate-y-1/2"
          >
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-foreground flex flex-col relative overflow-hidden font-sans">
      <AnimatePresence>
        {step > 0 && step <= totalQuestions && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full pt-8 px-6 sm:px-12 flex items-center justify-between z-10 max-w-5xl mx-auto"
          >
            <button 
              onClick={() => changeStep(step - 1)}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Step {step} of {totalQuestions}</span>
            </div>
            <button 
              onClick={() => completeOnboarding(true)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 flex items-center justify-center w-full p-6 sm:p-12 relative z-0">
        <AnimatePresence mode="wait" custom={direction}>
          
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-2xl text-center space-y-8"
            >
              <h1 className="text-5xl sm:text-6xl font-fraunces font-black tracking-tight text-foreground leading-tight">
                Welcome to StudentHub, {user?.full_name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-xl text-muted-foreground font-medium max-w-lg mx-auto">
                Let's set things up so your experience feels made for you.
              </p>
              <div className="pt-8">
                <Button 
                  size="lg" 
                  onClick={() => changeStep(1)}
                  className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 group"
                >
                  Let's Go <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {step > 0 && step <= totalQuestions && (() => {
            const q = questions[step - 1];
            return (
              <motion.div
                key={`q-${q.id}`}
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-2xl flex flex-col items-center"
              >
                <h2 className="text-3xl sm:text-4xl font-fraunces font-bold text-center mb-10 tracking-tight">{q.title}</h2>
                
                <div className="w-full space-y-4">
                  {q.type === "single" && q.options.map(opt => 
                    renderCard(opt, answers[q.id] === opt, () => handleSelectSingle(q.id, opt))
                  )}

                  {q.type === "multi" && (
                    <>
                      <div className="flex flex-wrap justify-center gap-3">
                        {q.options.map(opt => {
                          const isSelected = (answers[q.id] || []).includes(opt);
                          return (
                            <motion.button
                              key={opt}
                              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                              onClick={() => handleToggleMulti(q.id, opt)}
                              className={`px-6 py-4 rounded-full text-base font-medium border-2 transition-all duration-200 ${
                                isSelected 
                                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                                  : "border-border bg-card text-foreground hover:border-primary/50"
                              }`}
                            >
                              {opt}
                            </motion.button>
                          );
                        })}
                      </div>
                      <div className="mt-12 flex justify-center w-full">
                         <Button size="lg" onClick={() => changeStep(step + 1)} className="rounded-full px-12 h-14 text-lg">Continue</Button>
                      </div>
                    </>
                  )}

                  {q.type === "searchable" && (
                    <div className="w-full max-w-md mx-auto space-y-6">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search fields of study..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-border/50 bg-card text-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto p-1">
                        {q.options.filter(o => o.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                          q.options.filter(o => o.toLowerCase().includes(searchQuery.toLowerCase())).map(opt => 
                            renderCard(opt, answers[q.id] === opt, () => handleSelectSingle(q.id, opt))
                          )
                        ) : (
                          searchQuery.length > 0 && (
                            renderCard(`Use custom: "${searchQuery}"`, answers[q.id] === searchQuery, () => handleSelectSingle(q.id, searchQuery))
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {step > totalQuestions && (
            <motion.div
              key="summary"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-2xl text-center space-y-8"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-fraunces font-black tracking-tight text-foreground">
                You're all set, {user?.full_name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                We've personalized your dashboard to focus on {answers.primary_goal || 'what matters most to you'}. 
                Everything is ready.
              </p>
              <div className="pt-8">
                <Button 
                  size="lg" 
                  onClick={() => completeOnboarding()}
                  disabled={isSubmitting}
                  className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 group"
                >
                  {isSubmitting ? 'Saving...' : 'Go to Dashboard'}
                  {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default OnboardingFlow;
