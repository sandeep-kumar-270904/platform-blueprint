import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem("cookie-consent");
    if (!hasConsented) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[400px] bg-card border border-border shadow-2xl rounded-2xl p-5 z-[9999]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <Cookie className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Cookie Consent</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  We use cookies to enhance your experience, analyze platform traffic, and serve tailored content. 
                  Read our <a href="/p/privacy" className="underline hover:text-primary">Privacy Policy</a>.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDecline}
              className="text-muted-foreground hover:bg-muted p-1 rounded-full transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1 text-xs h-9" onClick={handleDecline}>
              Decline Optional
            </Button>
            <Button className="flex-1 text-xs h-9" onClick={handleAccept}>
              Accept All
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
