import { Header } from "@/components/layout/Header";

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="bg-muted py-16 text-center border-b border-border/40">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
        <p className="text-xl text-muted-foreground">Last updated: August 2026</p>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl prose prose-invert">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using StudentHub, you agree to be bound by these Terms of Service.</p>
        
        <h2>2. User Accounts</h2>
        <p>You are responsible for safeguarding your password and for all activities that occur under your account.</p>
        
        <h2>3. Acceptable Use</h2>
        <p>You agree not to use the platform to post illegal, offensive, or infringing content, or to harass other users.</p>
        
        <h2>4. Termination</h2>
        <p>We may terminate or suspend your account immediately, without prior notice, for conduct that we determine violates these Terms.</p>
        
        <h2>5. Changes to Terms</h2>
        <p>We reserve the right to modify these terms at any time. We will notify you of significant changes.</p>
      </div>
    </div>
  );
};

export default TermsOfService;
