import { Button } from "@/components/ui/button";
import { X, ArrowRight, Scale } from "lucide-react";
import { Link } from "react-router-dom";

interface CompareBarProps {
  colleges: any[];
  onRemove: (id: string) => void;
}

export const CompareBar = ({ colleges, onRemove }: CompareBarProps) => {
  if (colleges.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full duration-300">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-1 items-center gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <div className="hidden md:flex flex-col text-sm font-medium mr-2">
            <span className="text-muted-foreground flex items-center gap-1"><Scale className="h-4 w-4" /> Compare</span>
            <span>{colleges.length}/4 Selected</span>
          </div>
          
          {colleges.map((college) => (
            <div key={college._id} className="relative flex items-center gap-3 bg-muted rounded-md p-2 min-w-[200px] shrink-0 border border-border">
              <div className="text-2xl bg-background rounded p-1">{college.logoOrIcon || "🏛️"}</div>
              <div className="flex flex-col pr-6">
                <span className="text-sm font-semibold truncate max-w-[120px]">{college.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">{college.location?.city}</span>
              </div>
              <button 
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground bg-background/50 rounded-full p-0.5"
                onClick={() => onRemove(college._id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Placeholders for remaining slots */}
          {Array.from({ length: Math.max(0, 4 - colleges.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center justify-center border border-dashed border-border bg-muted/30 rounded-md p-2 min-w-[200px] h-[58px] shrink-0 text-muted-foreground text-sm">
              Add college
            </div>
          ))}
        </div>

        <div className="flex shrink-0 w-full md:w-auto gap-3">
          <Link to={`/compare?ids=${colleges.map(c => c._id).join(',')}`} className="w-full md:w-auto">
            <Button 
              size="lg" 
              disabled={colleges.length < 2} 
              className="w-full font-semibold shadow-xl"
            >
              Compare Now {colleges.length < 2 && "(Select at least 2)"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
