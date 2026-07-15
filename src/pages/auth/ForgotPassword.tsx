import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("If that email exists, a reset link has been sent");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } catch (err) {
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/auth" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>
        
        <div className="bg-card text-card-foreground shadow-sm rounded-xl border p-8">
          <div className="flex flex-col space-y-1.5 mb-6 text-center">
            <h3 className="font-semibold tracking-tight text-2xl">Reset Password</h3>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setSubmitted(false)}>
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending link..." : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
