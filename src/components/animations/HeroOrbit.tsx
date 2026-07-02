import { motion } from "framer-motion";
import { BookOpen, Calendar, MessageSquare, GraduationCap } from "lucide-react";

export const HeroOrbit = () => {
  return (
    <div className="relative w-64 h-64 mx-auto mt-12 md:mt-16">
      {/* Central Hub */}
      <div className="absolute inset-0 m-auto w-20 h-20 bg-background rounded-full border-2 border-primary/20 shadow-sm flex items-center justify-center z-10">
        <GraduationCap className="w-10 h-10 text-primary" />
      </div>

      {/* Orbit Rings */}
      <div className="absolute inset-0 border border-primary/10 rounded-full" />
      <div className="absolute inset-[-40px] border border-primary/5 rounded-full" />

      {/* Orbiting Nodes */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-8 h-8 bg-card border border-accent/20 rounded-full flex items-center justify-center shadow-sm">
          <BookOpen className="w-4 h-4 text-accent" />
        </div>
        <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-8 h-8 bg-card border border-accent-pine/20 rounded-full flex items-center justify-center shadow-sm">
          <Calendar className="w-4 h-4 text-accent-pine" />
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-[-40px]"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/2 left-[-16px] -translate-y-1/2 w-8 h-8 bg-card border border-accent-sienna/20 rounded-full flex items-center justify-center shadow-sm">
          <MessageSquare className="w-4 h-4 text-accent-sienna" />
        </div>
      </motion.div>
    </div>
  );
};
