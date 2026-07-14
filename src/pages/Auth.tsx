import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BookOpen, Eye, EyeOff, Code, Briefcase, Network, Link as LinkIcon, Check, CheckCircle2 } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { Turnstile } from '@marsidev/react-turnstile';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  
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
  
  const signinTabRef = useRef<HTMLButtonElement>(null);
  const signupTabRef = useRef<HTMLButtonElement>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const pwHasLength = password.length >= 8;
  const pwHasUpper = /[A-Z]/.test(password);
  const pwHasLower = /[a-z]/.test(password);
  const pwHasNumber = /[0-9]/.test(password);
  const pwHasSpecial = /[^A-Za-z0-9]/.test(password);
  const pwScore = [pwHasLength, pwHasUpper, pwHasLower, pwHasNumber, pwHasSpecial].filter(Boolean).length;
  
  let pwStrength = "WEAK";
  let pwColor = "var(--ribbon)";
  if (pwScore >= 5) {
    pwStrength = "STRONG";
    pwColor = "var(--success)";
  } else if (pwScore >= 3) {
    pwStrength = "FAIR";
    pwColor = "var(--gold)";
  }

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

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
        document.cookie = 'new_device_alert=; Max-Age=0; path=/';
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
          if (response?.newDeviceDetails) {
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
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="h-8 w-8 rounded-full border-4 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Animation values for tab transition
  const isSignIn = activeTab === "signin";

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[var(--cover)] text-[var(--cream-text)] font-sans m-0 p-0 overflow-hidden">
      
      {/* LEFT PANEL (COVER) */}
      <div className="w-full md:w-[58%] flex flex-col justify-between p-8 md:px-[64px] md:pt-[32px] md:pb-[64px] min-h-[40vh] md:min-h-screen relative z-8 shrink-0">
        <div>
          {/* Logo Row */}
          <div 
            className="flex items-center gap-3 cursor-pointer group w-fit mb-12 md:mb-16" 
            onClick={() => navigate("/")} 
            tabIndex={0} 
            role="link" 
            aria-label="Go to homepage" 
            onKeyDown={(e) => { if(e.key === 'Enter') navigate("/") }}
          >
            <div className="w-8 h-8 bg-[var(--cover-line)] rounded-[8px] flex items-center justify-center transition-colors">
              <BookOpen className="h-6 w-6 text-[var(--gold)]" />
            </div>
            <span className="font-serif font-semibold text-[20px] text-[var(--cream-text)] tracking-tight">NotesHub</span>
          </div>

          {/* Hero Block */}
          <div className="max-w-md">
            <h1 className="display-headline text-[var(--cream-text)] mb-6">
              Every page you<br />turn is progress.
            </h1>
            <p className="subhead text-[var(--cream-text)] mb-10 md:mb-10 max-w-[380px]">
              {isSignIn 
                ? "Pick up right where you left off. Your DSA logs, applications, and network are waiting."
                : "Join a platform built for serious students. Organize your knowledge, track your placements, and land the offer."}
            </p>

            {/* Feature List (Hidden on mobile) */}
            <div className="hidden md:flex flex-col space-y-[28px]">
              {[
                { title: "DSA & Interview Logs", desc: "Track patterns, not just problems. Build a searchable knowledge base.", icon: Code },
                { title: "Application Tracker", desc: "From referral to offer. Never drop the ball on a follow-up.", icon: Briefcase },
                { title: "Placement CRM", desc: "Manage your networking and recruiter contacts in one place.", icon: Network }
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-start w-[32px] shrink-0 gap-2">
                    <span className="ledger-label text-[var(--gold-deep)] opacity-80 leading-none">0{i + 1}</span>
                    <point.icon className="h-[20px] w-[20px] text-[var(--gold)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="subhead text-[var(--cream-text)] mb-1">{point.title}</h3>
                    <p className="body-text text-[var(--cream-soft)]">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer (Hidden on mobile) */}
        <div className="hidden md:flex flex-col items-start mt-12">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-80">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 6h8M8 10h10M8 14h6" />
            <path d="M14 2v6l-2-2-2 2V2" fill="var(--gold)" stroke="none" />
          </svg>
          <div className="text-[12px] text-[var(--cream-soft)] font-medium tracking-wide">
            © {new Date().getFullYear()} NotesHub. Keep learning.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (PAPER) */}
      <div className="w-full md:w-[42%] bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center relative p-6 md:p-8 shrink-0 min-h-[60vh] md:min-h-screen">
        
        {/* Deckled Edge Mask (Only visible on desktop where the seam is vertical) */}
        <div className="hidden md:block absolute top-0 left-[-16px] w-[16px] h-full bg-[var(--paper)] deckled-mask z-24 pointer-events-none" />

        <div 
          className="w-full max-w-[440px] relative transition-opacity duration-300 ease-out"
          style={{ animation: 'fadeRise 300ms ease-out forwards' }}
        >
          {linkingState.required ? (
            <div className="flex flex-col text-center" aria-live="polite">
              <div className="mx-auto p-3 rounded-full mb-4 border border-[var(--paper-edge)]">
                <LinkIcon className="h-6 w-6 text-[var(--ink-soft)]" />
              </div>
              <h2 className="font-serif text-[24px] font-medium mb-2 text-[var(--ink)]">Account linking required</h2>
              <p className="body-text text-[var(--ink-soft)] mb-6">
                Your existing account and data are safe. We just need to connect this new sign-in method. Please sign in using <strong>{linkingState.method === 'local' ? 'your password' : linkingState.method}</strong>.
              </p>
              <button 
                onClick={() => setLinkingState({ required: false, method: null })}
                className="ledger-label text-[var(--gold-deep)] hover:text-[var(--gold)] transition-colors focus:ring-2 focus:ring-[var(--gold)] focus:outline-none rounded px-2 py-1"
              >
                Continue to sign in
              </button>
            </div>
          ) : (
            <>
              {/* Call-number Detail */}
              <div className="absolute top-[-20px] md:top-[-40px] right-0 ledger-label text-[11px] text-[var(--gold-deep)]">
                NH · 001
              </div>

              {/* Header */}
              <div className="ledger-label text-[var(--ink-soft)] mb-[20px]">
                Sign in to your dashboard
              </div>

              {/* Tabs */}
              <div className="flex gap-[24px] relative mb-[28px]" role="tablist" aria-label="Authentication Options">
                <button
                  ref={signinTabRef}
                  role="tab"
                  aria-selected={isSignIn}
                  id="tab-signin"
                  tabIndex={isSignIn ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, "signin")}
                  onClick={() => setActiveTab("signin")}
                  className={`font-serif text-[16px] font-medium transition-colors outline-none focus-visible:text-[var(--gold)] pb-2 relative ${isSignIn ? "text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
                >
                  Sign in
                  <span 
                    className="absolute left-0 bottom-[-8px] h-[2px] w-full bg-[var(--gold)]"
                    style={{
                      transform: isSignIn ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 220ms ease-out'
                    }}
                  />
                </button>
                <button
                  ref={signupTabRef}
                  role="tab"
                  aria-selected={!isSignIn}
                  id="tab-signup"
                  tabIndex={!isSignIn ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, "signup")}
                  onClick={() => setActiveTab("signup")}
                  className={`font-serif text-[16px] font-medium transition-colors outline-none focus-visible:text-[var(--gold)] pb-2 relative ${!isSignIn ? "text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
                >
                  Sign up
                  <span 
                    className="absolute left-0 bottom-[-8px] h-[2px] w-full bg-[var(--gold)]"
                    style={{
                      transform: !isSignIn ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 220ms ease-out'
                    }}
                  />
                </button>
              </div>

              {/* 1px Divider */}
              <div className="w-full h-[1px] bg-[var(--paper-edge)] mb-[28px]" />

              <div 
                className="relative overflow-hidden"
                style={{ 
                  transform: `translateX(${isSignIn ? '0px' : '-8px'})`, 
                  opacity: 1,
                  transition: 'transform 200ms ease-out, opacity 200ms ease-out'
                }}
              >
                <form onSubmit={handleAuth} className="flex flex-col">
                  {/* Signup Full Name */}
                  {!isSignIn && (
                    <div className="mb-[20px] relative">
                      <label htmlFor="fullName" className="block ledger-label text-[var(--gold-deep)] mb-[8px]">
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onFocus={() => setFullNameFocused(true)}
                        onBlur={() => setFullNameFocused(false)}
                        required={!isSignIn}
                        className="w-full bg-transparent border-0 px-0 py-1 text-[16px] text-[var(--ink)] font-normal outline-none placeholder:text-[var(--ink-soft)] placeholder:opacity-70"
                        placeholder="John Doe"
                      />
                      <div 
                        className="absolute bottom-0 left-0 w-full"
                        style={{
                          height: fullNameFocused ? '1.5px' : '1px',
                          backgroundColor: fullNameFocused ? 'var(--gold)' : 'var(--paper-edge)',
                          transition: 'all 150ms ease'
                        }}
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="mb-[20px] relative">
                    <label htmlFor="email" className="block ledger-label text-[var(--gold-deep)] mb-[8px]">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        required
                        className="w-full bg-transparent border-0 px-0 py-1 pr-8 text-[16px] text-[var(--ink)] font-normal outline-none placeholder:text-[var(--ink-soft)] placeholder:opacity-70"
                        placeholder="you@example.com"
                      />
                      {isEmailValid && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ animation: 'fadeRise 200ms ease-out' }}>
                          <Check className="h-4 w-4 text-[var(--success)]" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div 
                      className="absolute bottom-0 left-0 w-full"
                      style={{
                        height: emailFocused ? '1.5px' : '1px',
                        backgroundColor: emailFocused ? 'var(--gold)' : 'var(--paper-edge)',
                        transition: 'all 150ms ease'
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-[16px] relative">
                    <label htmlFor="password" className="block ledger-label text-[var(--gold-deep)] mb-[8px]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        required
                        minLength={8}
                        className="w-full bg-transparent border-0 px-0 py-1 pr-8 text-[16px] text-[var(--ink)] font-normal outline-none placeholder:text-[var(--ink-soft)] placeholder:opacity-70"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                      </button>
                    </div>
                    <div 
                      className="absolute bottom-0 left-0 w-full"
                      style={{
                        height: passwordFocused ? '1.5px' : '1px',
                        backgroundColor: passwordFocused ? 'var(--gold)' : 'var(--paper-edge)',
                        transition: 'all 150ms ease'
                      }}
                    />

                    {/* Password Strength Indicator (Signup Only) */}
                    {!isSignIn && (
                      <div className="mt-[12px] flex flex-col gap-[8px]" style={{ animation: 'fadeRise 200ms ease-out forwards' }}>
                        <div className="flex items-center justify-between">
                          <div className="ledger-label text-[var(--ink-soft)] text-[10px]">Strength</div>
                          <div className="ledger-label text-[10px] transition-colors duration-300" style={{ color: password.length === 0 ? 'var(--ink-soft)' : pwColor }}>
                            {password.length === 0 ? "NONE" : pwStrength}
                          </div>
                        </div>
                        <div className="flex gap-[4px] h-[3px]">
                          {[1, 2, 3].map(level => (
                            <div 
                              key={level} 
                              className="flex-1 rounded-[1px] transition-colors duration-300"
                              style={{ 
                                backgroundColor: password.length === 0 ? 'var(--paper-edge)' : 
                                                 (pwStrength === "WEAK" && level === 1) ? pwColor :
                                                 (pwStrength === "FAIR" && level <= 2) ? pwColor :
                                                 (pwStrength === "STRONG") ? pwColor : 'var(--paper-edge)'
                              }}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-x-[12px] gap-y-[4px] mt-[4px]">
                          {[
                            { label: "8+ characters", met: pwHasLength },
                            { label: "Uppercase letter", met: pwHasUpper },
                            { label: "Lowercase letter", met: pwHasLower },
                            { label: "Number", met: pwHasNumber },
                            { label: "Special character", met: pwHasSpecial }
                          ].map((rule, i) => (
                            <div key={i} className="flex items-center gap-[6px]">
                              <div className="w-[12px] h-[12px] flex items-center justify-center shrink-0">
                                {rule.met ? (
                                  <Check className="w-[10px] h-[10px] text-[var(--success)]" strokeWidth={3} />
                                ) : (
                                  <div className="w-[4px] h-[4px] rounded-full bg-[var(--ink-soft)] opacity-40" />
                                )}
                              </div>
                              <span className="body-text text-[11px] leading-none" style={{ color: rule.met ? 'var(--ink)' : 'var(--ink-soft)' }}>
                                {rule.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remember / Forgot */}
                  {isSignIn && (
                    <div className="flex items-center justify-between mb-[24px]">
                      <div className="flex items-center gap-2">
                        <input
                          id="remember"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-3.5 w-3.5 appearance-none rounded-sm border border-[var(--ink-soft)] checked:bg-[var(--gold)] checked:border-[var(--gold)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] cursor-pointer transition-colors"
                        />
                        <label htmlFor="remember" className="body-text text-[14px] text-[var(--ink-soft)] cursor-pointer select-none">
                          Remember me
                        </label>
                      </div>
                      <a href="/forgot-password" className="body-text text-[14px] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] rounded px-1">
                        Forgot password?
                      </a>
                    </div>
                  )}

                  {/* Signup Consent */}
                  {!isSignIn && (
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="relative w-full h-[52px] bg-[var(--cover)] text-[var(--cream-text)] font-sans font-semibold text-[15px] rounded-[6px] transition-all duration-150 hover:-translate-y-[1px] hover:bg-[#32231A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center mb-[24px]"
                  >
                    <div className="absolute bottom-0 left-[8px] right-[8px] h-[3px] bg-[var(--gold)] rounded-[2px]" />
                    {formLoading ? (
                      <div className="h-4 w-4 rounded-full border-2 border-[var(--cream-text)] border-t-transparent animate-spin" />
                    ) : authSuccessMode === 'success_signin' ? (
                      "Welcome back"
                    ) : authSuccessMode === 'success_signup' ? (
                      `Welcome, ${fullName.split(" ")[0].trim() || "there"}`
                    ) : isSignIn ? (
                      "Sign in"
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                {/* OR CONTINUE WITH Divider */}
                <div className="flex items-center gap-[16px] mb-[16px]">
                  <div className="flex-1 h-[1px] bg-[var(--paper-edge)]" />
                  <span className="ledger-label text-[var(--ink-soft)]">OR CONTINUE WITH</span>
                  <div className="flex-1 h-[1px] bg-[var(--paper-edge)]" />
                </div>

                {/* Social Buttons */}
                <div className="flex gap-[16px] mb-[20px]">
                  {[
                    { id: 'google', name: 'Google', icon: <SiGoogle className="w-[18px] h-[18px]" /> },
                    { id: 'github', name: 'GitHub', icon: <SiGithub className="w-[18px] h-[18px]" /> },
                    { id: 'linkedin', name: 'LinkedIn', icon: <FaLinkedin className="w-[18px] h-[18px]" /> }
                  ].map((provider) => (
                    <button
                      key={provider.id}
                      aria-label={`Sign in with ${provider.name}`}
                      onClick={() => handleSocialLogin(provider.id)}
                      disabled={socialLoading === provider.id || formLoading}
                      className="flex-1 h-[48px] flex items-center justify-center gap-[8px] bg-[var(--paper)] border border-[var(--paper-edge)] rounded-[6px] text-[var(--ink)] font-sans font-medium text-[14px] transition-colors duration-150 hover:bg-[var(--paper-edge)] hover:border-[var(--ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:opacity-50"
                    >
                      {socialLoading === provider.id ? (
                        <div className="h-4 w-4 rounded-full border-2 border-[var(--ink)] border-t-transparent animate-spin" />
                      ) : (
                        <>
                          {provider.icon}
                          <span className="hidden sm:inline">{provider.name}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>

                {/* Trust Line & Toggle */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-[24px]">
                    <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
                    <span className="ledger-label text-[var(--ink-soft)] text-[10px]">ENCRYPTED & SECURE</span>
                  </div>
                  <p className="body-text text-[14px] text-[var(--ink-soft)]">
                    {isSignIn ? "New to NotesHub? " : "Already have an account? "}
                    <button 
                      onClick={() => {
                        setActiveTab(isSignIn ? "signup" : "signin");
                        if (isSignIn) {
                          signupTabRef.current?.focus();
                        } else {
                          signinTabRef.current?.focus();
                        }
                      }}
                      className="text-[var(--ink)] hover:text-[var(--gold)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] rounded"
                    >
                      {isSignIn ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Global CSS for animations */}
      <style>{`
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .transition-transform { transition: none !important; }
          .scale-x-0, .scale-x-100 { transform: none !important; opacity: 0; }
          .active-underline { opacity: 1 !important; }
          .reduced-fade { transform: none !important; transition: opacity 100ms !important; }
          .reduced-instant { transition: none !important; animation: none !important; }
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
    </div>
  );
};

export default Auth;