import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BookOpen, Eye, EyeOff, CheckCircle2, Link as LinkIcon, Check, Code, Briefcase, Network } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SiGoogle, SiGithub, SiLinkedin } from "react-icons/si";
import { Turnstile } from '@marsidev/react-turnstile';
import { BookTransition } from "@/components/auth/BookTransition";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const shouldReduceMotion = useReducedMotion();
  
  const searchParams = new URLSearchParams(location.search);
  const urlError = searchParams.get("error");
  const urlMethod = searchParams.get("method");

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [formLoading, setFormLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [authSuccessMode, setAuthSuccessMode] = useState<'idle' | 'success_signin' | 'success_signup'>('idle');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");

  const [linkingState, setLinkingState] = useState<{ required: boolean; method: string | null }>({
    required: urlError === "linking_required",
    method: urlMethod
  });

  const { signIn, signUp, loading } = useAuth();
  
  const signinTabRef = useRef<HTMLButtonElement>(null);
  const signupTabRef = useRef<HTMLButtonElement>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (urlError === "oauth_failed") {
      toast.error("Social login failed. Please try again.");
    }
    const cookies = document.cookie.split(';');
    const newDeviceCookie = cookies.find(c => c.trim().startsWith('new_device_alert='));
    if (newDeviceCookie) {
      try {
        const details = JSON.parse(decodeURIComponent(newDeviceCookie.split('=')[1]));
        toast.info(`New sign-in detected from ${details.browser} on ${details.os}. Check your email.`);
        document.cookie = 'new_device_alert=; Max-Age=0; path=/'; // Clear it
      } catch (e) {}
    }
  }, [urlError]);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tab: "signin" | "signup") => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (tab === "signin") {
        setActiveTab("signup");
        signupTabRef.current?.focus();
      } else {
        setActiveTab("signin");
        signinTabRef.current?.focus();
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveTab(tab);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "signup") {
      if (!consent) {
        setConsentError(true);
        return;
      }
      setConsentError(false);
    }

    setFormLoading(true);

    try {
      if (activeTab === "signup") {
        await signUp({ email, password, username: fullName, full_name: fullName, consent, captchaToken });
        setAuthSuccessMode('success_signup');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } else {
        const response = await signIn({ email, password });
        setAuthSuccessMode('success_signin');
        setTimeout(() => {
          if (response.newDeviceDetails) {
            toast.info(`New sign-in detected from ${response.newDeviceDetails.browser} on ${response.newDeviceDetails.os}.`);
          }
          navigate(from, { replace: true });
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${activeTab === 'signin' ? 'sign in' : 'sign up'}`);
      setFormLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const leftPanel = (
    <div className="w-full h-full bg-zinc-950 text-zinc-50 p-8 md:px-16 md:py-12 flex flex-col overflow-hidden min-h-[50vh]">
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #ffffff 31px, #ffffff 32px)', backgroundPositionY: '40px' }} 
      />
      
      {/* Brand Header */}
      <div className="relative z-10 flex items-center gap-3 cursor-pointer group w-fit mb-12" onClick={() => navigate("/")} tabIndex={0} role="link" aria-label="Go to homepage" onKeyDown={(e) => { if(e.key === 'Enter') navigate("/") }}>
        <div className="p-2.5 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
          <BookOpen className="h-6 w-6 text-amber-500" />
        </div>
        <span className="font-serif text-xl font-medium tracking-tight">NotesHub</span>
      </div>

      {/* Storytelling Copy */}
      <div className="relative z-10 max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          >
            <h1 className="text-4xl md:text-5xl font-serif leading-[1.15] mb-4 text-zinc-100">
              {activeTab === "signin" ? "Every page you turn is progress." : "Start your shelf."}
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-10">
              {activeTab === "signin" 
                ? "Pick up right where you left off. Your DSA logs, applications, and network are waiting."
                : "Join a platform built for serious students. Organize your knowledge, track your placements, and land the offer."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Feature Components */}
        <div className="space-y-6">
          {[
            { title: "DSA & Interview Logs", desc: "Track patterns, not just problems. Build a searchable knowledge base.", icon: Code, delay: 0.1 },
            { title: "Application Tracker", desc: "From referral to offer. Never drop the ball on a follow-up.", icon: Briefcase, delay: 0.2 },
            { title: "Placement CRM", desc: "Manage your networking and recruiter contacts in one place.", icon: Network, delay: 0.3 }
          ].map((point, i) => {
            const Icon = point.icon;
            return (
            <motion.div 
              key={i}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : point.delay, duration: shouldReduceMotion ? 0 : 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="p-2.5 bg-amber-500/10 rounded-md border border-amber-500/20 shadow-sm mt-0.5">
                <Icon className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-100 tracking-wide">{point.title}</h3>
                <p className="text-[14px] text-zinc-400 mt-1 leading-snug">{point.desc}</p>
              </div>
            </motion.div>
            )
          })}
        </div>
      </div>

      {/* Spacer and Grounding Illustration */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pt-12 pb-4 items-start">
        <div className="opacity-[0.15] mix-blend-screen text-amber-500">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 6h8M8 10h10M8 14h6" />
            <path d="M14 2v6l-2-2-2 2V2" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 text-sm text-zinc-600 font-medium">
        © {new Date().getFullYear()} NotesHub. Keep learning.
      </div>
    </div>
  );

  const rightPanel = (
    <motion.div 
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full bg-[#FDFBF7] p-8 md:p-16 flex flex-col justify-center items-center relative origin-right"
    >
      {/* Ribbon */}
      <div className="absolute top-0 right-12 w-10 h-32 md:h-40 pointer-events-none z-0">
        <svg viewBox="0 0 40 160" preserveAspectRatio="none" className="w-full h-full drop-shadow-md">
          <path d="M0 0 H40 V160 L20 144 L0 160 Z" fill="#b91c1c" />
          <path d="M0 0 H40 V160 L20 144 L0 160 Z" fill="url(#ribbon-gradient)" />
          <defs>
            <linearGradient id="ribbon-gradient" x1="0" y1="0" x2="40" y2="0">
              <stop offset="0%" stopColor="black" stopOpacity="0.2" />
              <stop offset="20%" stopColor="white" stopOpacity="0.1" />
              <stop offset="80%" stopColor="transparent" />
              <stop offset="100%" stopColor="black" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Fake missing corner revealing background (zinc-950) */}
      <div className="absolute top-0 right-0 w-[64px] h-[64px] pointer-events-none z-10">
         <div className="w-full h-full bg-zinc-950" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
      </div>
      
      {/* Dog ear fold */}
      <div className="absolute top-0 right-0 w-[64px] h-[64px] pointer-events-none z-20">
         <div className="w-full h-full bg-[#EAE5D9] shadow-[inset_-2px_2px_4px_rgba(0,0,0,0.05),-4px_4px_12px_rgba(0,0,0,0.1)]" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}>
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-black/10" />
         </div>
      </div>

      <div className="w-full max-w-sm z-30 relative py-8">
        {linkingState.required ? (
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }} 
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            className="bg-zinc-100/50 border border-zinc-200 p-6 mb-8 flex flex-col items-center text-center shadow-sm"
            aria-live="polite"
          >
            <div className="p-3 bg-white rounded-full shadow-sm mb-4 border border-zinc-100">
              <LinkIcon className="h-6 w-6 text-zinc-600" />
            </div>
            <h2 className="font-serif text-xl mb-2 text-zinc-900">Account linking required</h2>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              We found an existing account with that email. Please sign in using <strong>{linkingState.method === 'local' ? 'your password' : linkingState.method}</strong> to link them together securely.
            </p>
            <button 
              onClick={() => setLinkingState({ required: false, method: null })}
              className="text-xs uppercase tracking-wider font-semibold text-amber-600 hover:text-amber-700 transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none rounded px-2 py-1"
            >
              Continue to sign in
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2 mb-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-2">Sign in to your dashboard</span>
            <div className="flex gap-8 border-b border-zinc-200 relative" role="tablist" aria-label="Authentication Options">
              <button
                ref={signinTabRef}
                role="tab"
                aria-selected={activeTab === "signin"}
                aria-controls="auth-form"
                id="tab-signin"
                tabIndex={activeTab === "signin" ? 0 : -1}
                onKeyDown={(e) => handleTabKeyDown(e, "signin")}
                onClick={() => setActiveTab("signin")}
                className={`pb-4 text-sm font-medium transition-colors outline-none focus-visible:text-amber-600 ${activeTab === "signin" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
              >
                Sign in
              </button>
              <button
                ref={signupTabRef}
                role="tab"
                aria-selected={activeTab === "signup"}
                aria-controls="auth-form"
                id="tab-signup"
                tabIndex={activeTab === "signup" ? 0 : -1}
                onKeyDown={(e) => handleTabKeyDown(e, "signup")}
                onClick={() => setActiveTab("signup")}
                className={`pb-4 text-sm font-medium transition-colors outline-none focus-visible:text-amber-600 ${activeTab === "signup" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
              >
                Sign up
              </button>
              
              <motion.div
                className="absolute bottom-[-1px] left-0 h-0.5 bg-amber-500 origin-left"
                initial={false}
                animate={{ 
                  x: activeTab === "signin" ? 0 : 70,
                  width: activeTab === "signin" ? 48 : 55
                }}
                transition={{ type: "tween", ease: "circOut", duration: shouldReduceMotion ? 0 : 0.2 }}
              />
            </div>
          </div>
        )}

        <form 
          id="auth-form" 
          role="tabpanel" 
          aria-labelledby={`tab-${activeTab}`} 
          onSubmit={handleAuth} 
          className="space-y-7"
        >
          <AnimatePresence mode="popLayout">
            {activeTab === "signup" && !linkingState.required && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto", y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="space-y-2 relative group focus-within:ring-0"
              >
                <label htmlFor="fullname" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 transition-all duration-150 group-focus-within:-translate-y-0.5 group-focus-within:scale-95 group-focus-within:text-amber-700 origin-left">
                  Full Name
                </label>
                <input
                  id="fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={activeTab === "signup"}
                  className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 text-zinc-900 placeholder:text-zinc-400 focus:ring-0 outline-none transition-colors"
                  placeholder="Jane Doe"
                />
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-150 origin-left" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2 relative group focus-within:ring-0">
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 transition-all duration-150 group-focus-within:-translate-y-0.5 group-focus-within:scale-95 group-focus-within:text-amber-700 origin-left">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 pr-8 text-zinc-900 placeholder:text-zinc-400 focus:ring-0 outline-none transition-colors"
                placeholder="you@example.com"
              />
              <AnimatePresence>
                {isEmailValid && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                  >
                    <Check className="h-4 w-4 text-amber-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-150 origin-left" />
          </div>

          <div className="space-y-2 relative group focus-within:ring-0">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 transition-all duration-150 group-focus-within:-translate-y-0.5 group-focus-within:scale-95 group-focus-within:text-amber-700 origin-left">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 pr-10 text-zinc-900 placeholder:text-zinc-400 focus:ring-0 outline-none transition-colors font-medium ${!showPassword && password.length > 0 ? 'tracking-widest' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-2 outline-none focus-visible:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-150 origin-left" />
            {activeTab === 'signup' && (
              <p className="text-[11px] text-zinc-500 mt-1.5 transition-colors group-focus-within:text-zinc-600">Must be at least 6 characters long.</p>
            )}
          </div>

          {activeTab === 'signin' && !linkingState.required && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 appearance-none rounded-sm border-2 border-zinc-300 checked:border-amber-500 checked:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-all cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm font-medium text-zinc-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm font-medium text-zinc-600 hover:text-amber-600 underline decoration-transparent hover:decoration-amber-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1">
                Forgot password?
              </a>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {activeTab === "signup" && !linkingState.required && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto", y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="space-y-4 pt-2"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex items-start pt-1">
                    <input 
                      type="checkbox" 
                      id="consent"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (e.target.checked) setConsentError(false);
                      }}
                      className="peer h-4 w-4 appearance-none rounded-sm border-2 border-zinc-300 checked:border-amber-500 checked:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] transition-all cursor-pointer"
                    />
                    <svg className="absolute top-1.5 left-0.5 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <label htmlFor="consent" className="text-sm text-zinc-600 leading-snug cursor-pointer select-none">
                    I agree to the <a href="/terms" target="_blank" className="text-zinc-900 underline decoration-zinc-300 hover:decoration-amber-500 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1">Terms</a> and <a href="/privacy" target="_blank" className="text-zinc-900 underline decoration-zinc-300 hover:decoration-amber-500 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1">Privacy Policy</a>
                    <span aria-live="polite" className="block">
                      {consentError && <span className="block text-amber-600 text-xs mt-1 font-medium">Please accept the Terms to continue.</span>}
                    </span>
                  </label>
                </div>
                
                <div className="pt-2">
                  <Turnstile 
                    siteKey="1x00000000000000000000AA"
                    onSuccess={(token) => setCaptchaToken(token)}
                    options={{ size: 'invisible' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full mt-6 bg-zinc-950 text-zinc-50 py-3.5 px-4 font-medium transition-all hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none border-b-4 border-amber-500 flex items-center justify-center gap-2 active:translate-y-[2px] active:border-b-2"
          >
            {formLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-zinc-50 border-t-transparent animate-spin" />
            ) : authSuccessMode === 'success_signin' ? (
              "Welcome back"
            ) : authSuccessMode === 'success_signup' ? (
              "Welcome"
            ) : activeTab === "signin" ? (
              "Sign in"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="relative my-8 w-full flex items-center justify-center">
          <div className="flex-1 border-t border-zinc-300"></div>
          <span className="bg-[#FDFBF7] px-4 text-[11px] uppercase tracking-widest font-bold text-zinc-400">or continue with</span>
          <div className="flex-1 border-t border-zinc-300"></div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {[
            { id: 'google', name: 'Google', icon: <SiGoogle aria-hidden="true" className="w-4 h-4" /> },
            { id: 'github', name: 'GitHub', icon: <SiGithub aria-hidden="true" className="w-4 h-4" /> },
            { id: 'linkedin', name: 'LinkedIn', icon: <SiLinkedin aria-hidden="true" className="w-4 h-4" /> }
          ].map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSocialLogin(provider.id)}
              disabled={!!socialLoading || formLoading}
              aria-label={`Continue with ${provider.name}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent border border-zinc-300 text-zinc-700 text-sm font-semibold hover:bg-black/5 hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === provider.id ? (
                <span className="text-zinc-500">...</span>
              ) : (
                <>
                  <span className="text-zinc-700 flex-shrink-0">{provider.icon}</span>
                  <span className="truncate">Continue with {provider.name}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center items-center gap-2 opacity-60 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-500">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Encrypted & Secure</span>
        </div>

      </div>
    </motion.div>
  );

  return (
    <div className="font-sans selection:bg-amber-200 selection:text-amber-900">
      <BookTransition status={authSuccessMode} leftPanel={leftPanel} rightPanel={rightPanel} />
    </div>
  );
};

export default Auth;