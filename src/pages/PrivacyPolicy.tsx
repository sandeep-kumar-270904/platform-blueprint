import { Header } from "@/components/layout/Header";

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="bg-muted py-16 text-center border-b border-border/40">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-xl text-muted-foreground">Last updated: August 2026</p>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl prose prose-invert">
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, build a profile, or use our platform features.</p>
        
        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, as well as to personalize your experience on StudentHub.</p>
        
        <h2>3. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as described in this Privacy Policy or with your consent.</p>
        
        <h2>4. Data Security</h2>
        <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access.</p>
        
        <h2>5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at privacy@studenthub.com.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
