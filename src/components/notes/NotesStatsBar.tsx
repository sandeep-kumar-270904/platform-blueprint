import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { formatStat } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { TrendingUp } from "lucide-react";

interface NotesStatsBarProps {
  totalNotes: number;
  totalViews: number;
  totalDownloads: number;
  totalSubjects: number;
  isLoading?: boolean;
}

const AnimatedStat = ({ value, isLoading }: { value: number; isLoading: boolean }) => {
  const animatedValue = useCountUp(value, 300);
  
  if (isLoading) {
    return <div className="w-16 bg-muted/60 animate-pulse rounded h-6" />;
  }

  const displayValue = formatStat(animatedValue, true, "0");
  const isZero = value === 0;

  return (
    <p className={`font-medium tracking-tight leading-none text-[22px] ${isZero ? 'text-muted-foreground' : 'text-foreground'}`}>
      {displayValue}
    </p>
  );
};

export const NotesStatsBar = ({
  totalNotes,
  totalViews,
  totalDownloads,
  totalSubjects,
  isLoading = false,
}: NotesStatsBarProps) => {
  const stats = [
    { label: "Total Notes", value: totalNotes, trend: totalNotes > 0 ? "+12 this week" : null, accent: true },
    { label: "Total Views", value: totalViews, trend: totalViews > 0 ? "+45 this week" : null },
    { label: "Downloads", value: totalDownloads, trend: totalDownloads > 0 ? "+8 this week" : null },
    { label: "Subjects", value: totalSubjects, trend: totalSubjects > 0 ? "+2 this week" : null },
  ];

  return (
    <ScrollReveal>
      <div className="flex flex-wrap gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className={`flex-none w-[150px] h-[86px] bg-card shadow-sm rounded-xl transition-all hover:shadow-md hover:-translate-y-[1px] duration-200 overflow-hidden dark:bg-white/[0.02] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${stat.accent ? 'border-[1.5px] border-primary/60 dark:border-primary/50' : 'border border-border'}`}>
            <CardContent className="p-3 flex flex-col justify-center items-start h-full">
              <p className={`text-[11px] font-medium leading-none mb-1.5 ${stat.accent ? 'text-primary dark:text-primary/90' : 'text-muted-foreground'}`}>
                {stat.label}
              </p>
              <AnimatedStat value={stat.value} isLoading={isLoading} />
              
              {!isLoading ? (
                stat.trend && (
                  <div className="mt-1 flex items-center text-[10px] font-medium text-muted-foreground">
                    <TrendingUp className={`w-2.5 h-2.5 mr-1 ${stat.accent ? 'text-primary dark:text-primary/90' : ''}`} />
                    <span className={stat.accent ? "text-primary/90" : ""}>{stat.trend}</span>
                  </div>
                )
              ) : (
                <div className="mt-1 h-2.5 w-16 bg-muted/40 animate-pulse rounded" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollReveal>
  );
};
