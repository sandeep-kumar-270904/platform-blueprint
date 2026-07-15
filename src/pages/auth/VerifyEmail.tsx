import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid or missing verification token.");
        return;
      }
      
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
          // Refresh user session to update isEmailVerified flag
          await fetchUser();
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Failed to connect to the server.");
      }
    };

    verifyToken();
  }, [token, fetchUser]);

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card text-card-foreground shadow-sm rounded-xl border p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <h3 className="text-xl font-semibold">Verifying your email...</h3>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your link.</p>
          </div>
        )}
        
        {status === "success" && (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-[var(--success)]" />
            </div>
            <h3 className="text-xl font-semibold">Email Verified!</h3>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button className="w-full mt-4" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <XCircle className="h-10 w-10 text-[var(--ribbon)]" />
            </div>
            <h3 className="text-xl font-semibold">Verification Failed</h3>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/dashboard")}>
              Continue to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
