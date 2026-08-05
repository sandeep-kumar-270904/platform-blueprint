import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Check, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AuthGenesisLab } from "@/components/ui/AuthGenesisLab";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMode, setSuccessMode] = useState<'idle' | 'success'>('idle');

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

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (pwScore < 2) {
      setErrorMsg("Please choose a stronger password.");
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");

      toast.success(data.message || "Password has been updated!");
      setSuccessMode('success');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#1B120F] font-sans m-0 p-0 overflow-hidden relative">
      <div className="w-full md:w-[58%] flex flex-col items-center justify-center min-h-[40vh] md:min-h-screen relative z-8 shrink-0 overflow-hidden">
        <AuthGenesisLab isMobile={isMobile} />
      </div>

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
            <div className="mb-[28px]">
              <h3 className="font-serif text-[24px] font-medium text-[var(--ink)]">Set New Password</h3>
              <p className="text-[13px] text-[var(--ink-soft)] mt-1">Please enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="relative mb-[24px]">
                <label className={`absolute left-3 pointer-events-none transition-all duration-200 ease-out z-10 flex items-center gap-1 ${passwordFocused || password.length > 0 ? 'top-[6px] text-[11px] text-[var(--gold)] scale-[0.85]' : 'top-1/2 -translate-y-1/2 text-[15px] text-[var(--ink-soft)] scale-100'} origin-top-left`}>
                  New Password
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
                
                <div className="mt-2">
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
              </div>

              <div className="relative mb-[24px]">
                <label className={`absolute left-3 pointer-events-none transition-all duration-200 ease-out z-10 flex items-center gap-1 ${confirmPasswordFocused || confirmPassword.length > 0 ? 'top-[6px] text-[11px] text-[var(--gold)] scale-[0.85]' : 'top-1/2 -translate-y-1/2 text-[15px] text-[var(--ink-soft)] scale-100'} origin-top-left`}>
                  Confirm New Password
                </label>
                <div className={`relative bg-white/50 border rounded-md transition-all duration-150 ${confirmPasswordFocused ? 'ring-[3px] ring-[var(--gold)]/25 border-[var(--gold)] shadow-[0_0_12px_rgba(212,162,76,0.2)]' : 'border-[var(--paper-edge)]'}`}>
                  <input
                    type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    required
                    className="w-full bg-transparent border-0 px-3 pt-5 pb-1.5 pr-10 text-[15px] text-[var(--ink)] font-normal outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="relative mb-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] bg-[var(--cover)] text-[var(--cream-text)] font-sans font-semibold text-[15px] rounded-md flex items-center justify-center transition-all duration-200 hover:bg-[#32231A] hover:brightness-110 hover:shadow-[0_0_15px_rgba(212,162,76,0.3)] disabled:opacity-90 relative overflow-hidden"
                >
                  {errorMsg && <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 bg-[var(--ribbon)] text-white text-[10px] px-2 py-0.5 rounded-b-sm whitespace-nowrap z-20 flex items-center gap-1 shadow-sm"><XCircle className="w-2.5 h-2.5"/> {errorMsg}</div>}
                  
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="w-5 h-5 rounded-full border-[2px] border-[var(--gold)] border-t-transparent" />
                  ) : successMode === 'success' ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: [1.1, 1] }} transition={{ duration: 0.2, ease: "easeOut" }}>
                      <Check className="w-6 h-6 text-[var(--gold)]" strokeWidth={2.5}/>
                    </motion.div>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
