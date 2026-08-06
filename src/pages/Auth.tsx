import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Check, XCircle } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence, useReducedMotion, useAnimation } from "framer-motion";
import { AuthGenesisLab } from "@/components/ui/AuthGenesisLab";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  
  const searchParams = new URLSearchParams(location.search);
  const urlError = searchParams.get("error");
  const urlMethod = searchParams.get("method");

  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [formLoading, setFormLoading] = useState(false);
  const [authSuccessMode, setAuthSuccessMode] = useState<'idle' | 'success_signin' | 'success_signup' | 'error'>('idle');
  const [authErrorMsg, setAuthErrorMsg] = useState("");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");

  const [linkingState, setLinkingState] = useState<{ required: boolean; method: string | null }>({
    required: urlError === "linking_required",
    method: urlMethod
  });

  const { signIn, signUp, loading, user } = useAuth();
  
  const sessionStartTime = useRef<number>(Date.now());

  // Analytics Mock Function
  const trackAnalyticsEvent = (eventName: string, properties: Record<string, any>) => {
    // In production, this would call Mixpanel, PostHog, Segment, etc.
    console.log(`[ANALYTICS] ${eventName}`, properties);
  };
  
  const shouldReduceMotion = useReducedMotion() || false;
  const emailShakeControls = useAnimation();
  const buttonShakeControls = useAnimation();
  const [emailError, setEmailError] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonDimensions, setButtonDimensions] = useState<{width: number, height: number} | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const pwHasLength = password.length >= 8;
  const pwHasUpperLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const pwHasNumber = /[0-9]/.test(password);
  const pwHasSpecial = /[^A-Za-z0-9]/.test(password);
  const pwScore = [pwHasLength, pwHasUpperLower, pwHasNumber, pwHasSpecial].filter(Boolean).length;

  let pwStrengthText = "Weak";
  let pwColor = "var(--ribbon)";
  let pwSegments = 1;
  let missingRequirement = "Enter a password";

  if (password.length > 0) {
    if (!pwHasLength) missingRequirement = "Use 8 or more characters";
    else if (!pwHasUpperLower) missingRequirement = "Add uppercase and lowercase letters";
    else if (!pwHasNumber) missingRequirement = "Add a number";
    else if (!pwHasSpecial) missingRequirement = "Add a symbol";
    else missingRequirement = "Strong password!";

    if (pwScore === 4) { pwStrengthText = "Strong"; pwColor = "#c5a85b"; pwSegments = 4; }
    else if (pwScore === 3) { pwStrengthText = "Good"; pwColor = "var(--gold)"; pwSegments = 3; }
    else if (pwScore === 2) { pwStrengthText = "Fair"; pwColor = "#d68748"; pwSegments = 2; }
    else { pwStrengthText = "Weak"; pwColor = "var(--ribbon)"; pwSegments = 1; }
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Log page view telemetry
    trackAnalyticsEvent('auth_page_viewed', { timestamp: new Date().toISOString() });
  }, []);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    if (urlError === "oauth_failed") toast.error("Social login failed. Please try again.");
  }, [urlError]);

  const handleEmailBlur = () => {
    setEmailFocused(false);
    if (email.length > 0 && !isEmailValid) {
      setEmailError(true);
      if (!shouldReduceMotion) {
        emailShakeControls.start({ x: [-6, 6, -4, 4, 0], transition: { duration: 0.3 } });
      }
    } else {
      setEmailError(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg("");
    setAuthSuccessMode('idle');
    
    if (activeTab === "signup") {
      if (!consent) {
        setConsentError(true);
        return;
      }
      setConsentError(false);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonDimensions({ width: rect.width, height: rect.height });
    }

    setFormLoading(true);

    if (activeTab === "forgot") {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error("Failed to send reset link");
        toast.success("If an account exists, a reset link was sent! (Please check your Spam/Junk folder)");
        setTimeout(() => setActiveTab("signin"), 1500);
      } catch (err: any) {
        setAuthErrorMsg(err.message);
        setAuthSuccessMode('error');
        if (!shouldReduceMotion) buttonShakeControls.start({ x: [-6, 6, -4, 4, 0], transition: { duration: 0.3 } });
      } finally {
        setFormLoading(false);
      }
      return;
    }

    try {
      const timeToCompletionMs = Date.now() - sessionStartTime.current;

      if (activeTab === "signup") {
        await signUp({ email, password, username: fullName, full_name: fullName, consent, captchaToken });
        trackAnalyticsEvent('auth_success', { method: 'email', is_signup: true, time_to_completion_ms: timeToCompletionMs });
        setAuthSuccessMode('success_signup');
        toast.success("Account created successfully! Please check your email (including Spam/Junk) to verify.", { duration: 6000 });
        setTimeout(() => navigate(from, { replace: true }), 500);
      } else {
        await signIn({ email, password });
        trackAnalyticsEvent('auth_success', { method: 'email', is_signup: false, time_to_completion_ms: timeToCompletionMs });
        setAuthSuccessMode('success_signin');
        setTimeout(() => navigate(from, { replace: true }), 500);
      }
    } catch (error: any) {
      const msg = error.message || `Failed to sign ${activeTab === 'signin' ? 'in' : 'up'}`;
      setAuthErrorMsg(msg);
      setAuthSuccessMode('error');
      if (!shouldReduceMotion) {
        buttonShakeControls.start({ x: [-6, 6, -4, 4, 0], transition: { duration: 0.3 } });
      }
      setFormLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${API_URL}/api/auth/${provider}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1B120F]">
        <div className="h-8 w-8 rounded-full border-4 border-[#D4A24C] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isSignIn = activeTab === "signin";
  const isForgot = activeTab === "forgot";
  const disableAnimations = isMobile || shouldReduceMotion;

  const formVariants = {
    enter: { opacity: 0, x: 8 },
    center: { opacity: 1, x: 0, transition: { duration: 0.15, delay: 0.05, ease: "easeInOut" } },
    exit: { opacity: 0, x: -8, position: "absolute" as const, top: 0, left: 0, width: "100%", transition: { duration: 0.15, ease: "easeInOut" } }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#1B120F] font-sans m-0 p-0 overflow-hidden relative">
      
      {/* LEFT PANEL */}
      <div className="w-full md:w-[58%] flex flex-col items-center justify-center min-h-[40vh] md:min-h-screen relative z-8 shrink-0 overflow-hidden">
        <AuthGenesisLab isMobile={isMobile} />
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="w-full md:w-[42%] bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center relative p-6 md:p-8 shrink-0 min-h-[60vh] md:min-h-screen">
        <div className="hidden md:block absolute top-0 left-[-16px] w-[16px] h-full bg-[var(--paper)] deckled-mask z-24 pointer-events-none" />
        
        <div className="w-full max-w-[440px] flex flex-col items-center">
          <motion.div 
            className="w-full relative bg-[var(--paper)] p-8 rounded-2xl z-10"
            style={{ boxShadow: '0px 20px 60px rgba(0,0,0,0.4), 0px 0px 40px rgba(212,175,55,0.06)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {linkingState.required ? (
              <div className="flex flex-col text-center">
                <h2 className="font-serif text-[24px] font-medium mb-2">Account linking required</h2>
                <button onClick={() => setLinkingState({ required: false, method: null })}>Continue</button>
              </div>
            ) : (
              <>
                {/* Tabs */}
                {!isForgot ? (
                  <div className="flex gap-[16px] relative mb-[28px] p-1 bg-black/5 rounded-lg w-fit" role="tablist">
                    <button
                      role="tab"
                      onClick={() => setActiveTab("signin")}
                      className={`relative px-4 py-1.5 font-serif text-[15px] font-medium transition-colors outline-none rounded-md ${isSignIn ? "text-[var(--gold-deep)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
                    >
                      <span className="relative z-10">Sign in</span>
                      {isSignIn && (
                        <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-white shadow-sm rounded-md border border-black/5" transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 25, mass: 0.8 }} />
                      )}
                    </button>
                    <button
                      role="tab"
                      onClick={() => setActiveTab("signup")}
                      className={`relative px-4 py-1.5 font-serif text-[15px] font-medium transition-colors outline-none rounded-md ${!isSignIn ? "text-[var(--gold-deep)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
                    >
                      <span className="relative z-10">Create account</span>
                      {!isSignIn && (
                        <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-white shadow-sm rounded-md border border-black/5" transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 25, mass: 0.8 }} />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mb-[28px]">
                    <h3 className="font-serif text-[20px] font-medium text-[var(--ink)]">Reset Password</h3>
                    <p className="text-[13px] text-[var(--ink-soft)] mt-1">Enter your email and we'll send a reset link.</p>
                  </div>
                )}

                <div className="relative w-full overflow-visible">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={activeTab}
                      variants={formVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full"
                    >
                      <form onSubmit={handleAuth} className="flex flex-col">
                        
                        {!isSignIn && !isForgot && (
                          <div className="relative mb-[20px]">
                            <label className={`absolute left-3 pointer-events-none transition-all duration-200 ease-out z-10 flex items-center gap-1 ${fullNameFocused || fullName.length > 0 ? 'top-[6px] text-[11px] text-[var(--gold)] scale-[0.85]' : 'top-1/2 -translate-y-1/2 text-[15px] text-[var(--ink-soft)] scale-100'} origin-top-left`}>
                              Full Name
                            </label>
                            <div className={`relative bg-white/50 border rounded-md transition-all duration-150 ${fullNameFocused ? 'ring-[3px] ring-[var(--gold)]/25 border-[var(--gold)] shadow-[0_0_12px_rgba(212,162,76,0.2)]' : 'border-[var(--paper-edge)]'}`}>
                              <input
                                type="text" value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onFocus={() => setFullNameFocused(true)}
                                onBlur={() => setFullNameFocused(false)}
                                required={!isSignIn && !isForgot}
                                className="w-full bg-transparent border-0 px-3 pt-5 pb-1.5 text-[15px] text-[var(--ink)] font-normal outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div className="relative mb-[20px]">
                          <label className={`absolute left-3 pointer-events-none transition-all duration-200 ease-out z-10 flex items-center gap-1 ${emailFocused || email.length > 0 ? 'top-[6px] text-[11px] text-[var(--gold)] scale-[0.85]' : 'top-1/2 -translate-y-1/2 text-[15px] text-[var(--ink-soft)] scale-100'} origin-top-left`}>
                            Email Address
                          </label>
                          <motion.div animate={emailShakeControls} className={`relative bg-white/50 border rounded-md transition-all duration-150 ${emailFocused ? 'ring-[3px] ring-[var(--gold)]/25 border-[var(--gold)] shadow-[0_0_12px_rgba(212,162,76,0.2)]' : emailError ? 'border-[var(--ribbon)] ring-[3px] ring-[var(--ribbon)]/25' : 'border-[var(--paper-edge)]'}`}>
                            <input
                              type="email" value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setEmailFocused(true)}
                              onBlur={handleEmailBlur}
                              required
                              className="w-full bg-transparent border-0 px-3 pt-5 pb-1.5 text-[15px] text-[var(--ink)] font-normal outline-none"
                            />
                            {isEmailValid && email.length > 0 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Check className="h-4 w-4 text-[var(--success)]" strokeWidth={2.5} />
                              </motion.div>
                            )}
                          </motion.div>
                          {emailError && (
                            <span className="text-[12px] text-[var(--ribbon)] font-medium mt-1.5 flex items-center gap-1">
                               <XCircle className="w-3 h-3"/> Enter a valid email address
                            </span>
                          )}
                        </div>

                        {!isForgot && (
                          <div className="relative mb-[24px]">
                            <label className={`absolute left-3 pointer-events-none transition-all duration-200 ease-out z-10 flex items-center gap-1 ${passwordFocused || password.length > 0 ? 'top-[6px] text-[11px] text-[var(--gold)] scale-[0.85]' : 'top-1/2 -translate-y-1/2 text-[15px] text-[var(--ink-soft)] scale-100'} origin-top-left`}>
                              Password
                            </label>
                            <div className={`relative bg-white/50 border rounded-md transition-all duration-150 ${passwordFocused ? 'ring-[3px] ring-[var(--gold)]/25 border-[var(--gold)] shadow-[0_0_12px_rgba(212,162,76,0.2)]' : 'border-[var(--paper-edge)]'}`}>
                            <input
                              type={showPassword ? "text" : "password"} value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setPasswordFocused(true)}
                              onBlur={() => setPasswordFocused(false)}
                              required
                              className="w-full bg-transparent border-0 px-3 pt-5 pb-1.5 pr-10 text-[15px] text-[var(--ink)] font-normal outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] focus:outline-none"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          
                          {isSignIn && (
                            <div className="flex justify-end mt-2">
                              <button 
                                type="button" 
                                onClick={() => setActiveTab("forgot")}
                                className="text-[12px] font-medium text-[var(--gold-deep)] hover:text-[var(--gold)] hover:underline transition-colors"
                              >
                                Forgot Password?
                              </button>
                            </div>
                          )}
                          
                          {!isSignIn && (
                            <div className="mt-2" style={{ animation: 'fadeRise 200ms ease-out forwards' }}>
                              <div className="flex gap-1 h-1.5 mb-1.5">
                                {[1, 2, 3, 4].map(level => (
                                  <div 
                                    key={level} 
                                    className="flex-1 rounded-sm transition-colors duration-300"
                                    style={{ backgroundColor: password.length === 0 ? 'var(--paper-edge)' : level <= pwSegments ? pwColor : 'var(--paper-edge)' }}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium" style={{ color: password.length === 0 ? 'var(--ink-soft)' : pwColor }}>
                                  {password.length === 0 ? "Password required" : missingRequirement}
                                </span>
                                <span className="text-[11px] font-bold" style={{ color: password.length === 0 ? 'var(--ink-soft)' : pwColor }}>
                                  {password.length === 0 ? "" : pwStrengthText}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        )}
                        
                        {!isSignIn && !isForgot && (
                          <div className="mb-[24px]">
                            <div className="flex items-start gap-2">
                              <div className="relative pt-1">
                                <input 
                                  type="checkbox" 
                                  id="consent"
                                  checked={consent}
                                  onChange={(e) => {
                                    setConsent(e.target.checked);
                                    if (e.target.checked) setConsentError(false);
                                  }}
                                  className="peer h-3.5 w-3.5 appearance-none rounded-sm border border-[var(--ink-soft)] checked:bg-[var(--gold)] checked:border-[var(--gold)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] cursor-pointer transition-colors"
                                />
                                <Check className="absolute top-[5px] left-[1px] h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                              </div>
                              <label htmlFor="consent" className="body-text text-[13px] text-[var(--ink-soft)] cursor-pointer select-none leading-snug">
                                I agree to the <a href="/terms" className="text-[var(--ink)] hover:text-[var(--gold)] underline transition-colors">Terms</a> and <a href="/privacy" className="text-[var(--ink)] hover:text-[var(--gold)] underline transition-colors">Privacy Policy</a>
                                {consentError && <span className="block text-[var(--ribbon)] mt-1 font-medium">Please accept the Terms to continue.</span>}
                              </label>
                            </div>
                            <div className="pt-2">
                              <Turnstile 
                                siteKey="1x00000000000000000000AA"
                                onSuccess={(token) => setCaptchaToken(token)}
                                options={{ size: 'invisible' }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="relative mb-6">
                          <motion.button
                            ref={buttonRef}
                            type="submit"
                            disabled={formLoading}
                            animate={buttonShakeControls}
                            style={buttonDimensions ? { width: buttonDimensions.width, height: buttonDimensions.height } : {}}
                            className="w-full h-[48px] bg-[var(--cover)] text-[var(--cream-text)] font-sans font-semibold text-[15px] rounded-md flex items-center justify-center transition-all duration-200 hover:bg-[#32231A] hover:brightness-110 hover:shadow-[0_0_15px_rgba(212,162,76,0.3)] disabled:opacity-90 relative overflow-hidden"
                          >
                            {authErrorMsg && <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 bg-[var(--ribbon)] text-white text-[10px] px-2 py-0.5 rounded-b-sm whitespace-nowrap z-20 flex items-center gap-1 shadow-sm"><XCircle className="w-2.5 h-2.5"/> {authErrorMsg}</div>}
                            
                            {formLoading ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="w-5 h-5 rounded-full border-[2px] border-[var(--gold)] border-t-transparent" />
                            ) : authSuccessMode !== 'idle' && authSuccessMode !== 'error' ? (
                              <motion.div initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0 }} animate={shouldReduceMotion ? { opacity: 1 } : { scale: [1.1, 1] }} transition={{ duration: 0.2, ease: "easeOut" }}>
                                <Check className="w-6 h-6 text-[var(--gold)]" strokeWidth={2.5}/>
                              </motion.div>
                            ) : (
                              <span>{isForgot ? "Send Reset Link" : (isSignIn ? "Sign in" : "Create Account")}</span>
                            )}
                          </motion.button>
                        </div>
                        
                        {isForgot && (
                          <div className="text-center mt-2">
                            <button type="button" onClick={() => setActiveTab("signin")} className="text-[13px] text-[var(--ink-soft)] hover:text-[var(--gold-deep)] transition-colors underline">
                              Back to sign in
                            </button>
                          </div>
                        )}

                        {!isForgot && (
                          <>
                            {/* Socials */}
                            <div className="flex items-center gap-4 mb-5">
                              <div className="flex-1 h-[1px] bg-[var(--paper-edge)]" />
                              <span className="text-[11px] font-semibold text-[var(--ink-soft)] tracking-wider">OR</span>
                              <div className="flex-1 h-[1px] bg-[var(--paper-edge)]" />
                            </div>

                            <div className="flex gap-3">
                              {[
                                { id: 'google', name: 'Google', icon: SiGoogle },
                                { id: 'github', name: 'GitHub', icon: SiGithub },
                                { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin }
                              ].map((provider) => (
                                <motion.button
                                  key={provider.id}
                                  type="button"
                                  onClick={() => handleSocialLogin(provider.id)}
                                  whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0px 4px 12px rgba(212,162,76,0.15)' }}
                                  transition={{ duration: 0.15, ease: "easeOut" }}
                                  className="flex-1 h-[44px] flex items-center justify-center bg-white border border-[var(--paper-edge)] rounded-md text-[var(--ink-soft)] hover:text-[var(--gold-deep)] hover:border-[var(--gold)] transition-colors duration-150 group"
                                >
                                  <provider.icon className="w-[18px] h-[18px] transition-colors duration-150" />
                                </motion.button>
                              ))}
                            </div>
                          </>
                        )}
                      </form>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Auth;